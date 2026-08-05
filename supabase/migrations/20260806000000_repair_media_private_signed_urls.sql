-- SECURITY FIX: repair-media (customer repair photos/videos) has been a
-- fully public bucket with permanent, unauthenticated URLs — anyone who
-- ever obtains a URL (via the phone/token-gated lookup RPCs, or by any
-- other means) can view it forever, from anywhere, no login required. The
-- storage.objects SELECT policy also granted read `to public` (not just
-- `to authenticated`), which is a second, independent way the same
-- exposure existed even setting the bucket flag aside.
--
-- Flips the bucket private and replaces that policy with one scoped
-- exactly like wireless.ticket_media's own read policy (has_permission or
-- assigned technician). Staff clients now mint short-lived signed URLs at
-- display time via supabase.storage.createSignedUrls() — which this RLS
-- policy is what authorizes. The two public lookup RPCs (phone+ticket and
-- QR token) now also return file_path so the wireless-admin service can
-- mint signed URLs on the customer portal's behalf server-side (an
-- anonymous visitor has no session to sign anything with directly).

update storage.buckets set public = false where id = 'repair-media';

drop policy if exists "repair_media_bucket_read" on storage.objects;
create policy "repair_media_bucket_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'repair-media'
    and exists (
      select 1 from wireless.ticket_media m
      where m.file_path = storage.objects.name
        and (
          wireless.has_permission('ticket_media:view')
          or (
            wireless.current_role_scopes_tickets()
            and exists (
              select 1 from wireless.tickets t
              join wireless.ticket_technicians tt on tt.ticket_id = t.id
              where t.ticket_number = m.ticket_number
                and tt.technician_id = wireless.my_technician_id()
            )
          )
        )
    )
  );

drop function if exists wireless.lookup_ticket_media(text, text);

create or replace function wireless.lookup_ticket_media(p_ticket_number text default null, p_phone text default null)
returns table (
  stage         text,
  media_type    text,
  file_path     text,
  file_url      text,
  thumbnail_url text,
  caption       text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_ip         text;
  v_window     interval := interval '5 minutes';
  v_max_tries  int := 8;
  v_attempts   int;
  v_ticket     text := nullif(trim(coalesce(p_ticket_number, '')), '');
  v_phone_norm text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if v_ticket is null or length(v_phone_norm) < 9 then
    raise exception 'Please provide both your ticket number and phone number.';
  end if;

  v_ip := coalesce(
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-real-ip', ''),
    'unknown'
  );

  insert into wireless.lookup_rate_limit as rl (ip, window_start, attempts)
  values (v_ip, now(), 1)
  on conflict (ip) do update set
    attempts     = case when rl.window_start < now() - v_window then 1 else rl.attempts + 1 end,
    window_start = case when rl.window_start < now() - v_window then now() else rl.window_start end
  returning rl.attempts into v_attempts;

  if v_attempts > v_max_tries then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;

  if not exists (
    select 1 from wireless.tickets t
    where lower(t.ticket_number) = lower(v_ticket)
      and right(regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g'), 9) = right(v_phone_norm, 9)
  ) then
    return;
  end if;

  return query
    select m.stage, m.media_type, m.file_path, m.file_url, m.thumbnail_url, m.caption, m.created_at
    from wireless.ticket_media m
    where lower(m.ticket_number) = lower(v_ticket)
    order by m.created_at asc;
end;
$$;

revoke all on function wireless.lookup_ticket_media(text, text) from public;
grant execute on function wireless.lookup_ticket_media(text, text) to anon, authenticated;

drop function if exists wireless.lookup_ticket_media_by_token(uuid);

create or replace function wireless.lookup_ticket_media_by_token(p_token uuid)
returns table (
  stage         text,
  media_type    text,
  file_path     text,
  file_url      text,
  thumbnail_url text,
  caption       text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = wireless, public
as $$
begin
  if p_token is null then
    return;
  end if;

  return query
    select m.stage, m.media_type, m.file_path, m.file_url, m.thumbnail_url, m.caption, m.created_at
    from wireless.ticket_media m
    join wireless.tickets t on lower(t.ticket_number) = lower(m.ticket_number)
    where t.public_token = p_token
    order by m.created_at asc;
end;
$$;

revoke all on function wireless.lookup_ticket_media_by_token(uuid) from public;
grant execute on function wireless.lookup_ticket_media_by_token(uuid) to anon, authenticated;
