-- The staff app already lets technicians attach photos at every stage
-- (wireless.ticket_media, backed by the public 'repair-media' storage
-- bucket), but ticket_media is authenticated-only, so the public customer
-- portal has no way to discover which files exist for a ticket — the
-- bucket being public only helps once you already have a URL. Add a
-- second SECURITY DEFINER RPC, gated by the same exact ticket-number +
-- phone match and the same per-IP rate limit as wireless.lookup_ticket,
-- returning only customer-safe columns (no uploader identity, no internal
-- storage path/mime/size).

create or replace function wireless.lookup_ticket_media(p_ticket_number text default null, p_phone text default null)
returns table (
  stage         text,
  media_type    text,
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
    nullif(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1), ''),
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

  -- Re-validate the ticket+phone match ourselves rather than trusting the
  -- caller already called lookup_ticket — this RPC must stand on its own.
  if not exists (
    select 1 from wireless.tickets t
    where lower(t.ticket_number) = lower(v_ticket)
      and right(regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g'), 9) = right(v_phone_norm, 9)
  ) then
    return;
  end if;

  return query
    select m.stage, m.media_type, m.file_url, m.thumbnail_url, m.caption, m.created_at
    from wireless.ticket_media m
    where lower(m.ticket_number) = lower(v_ticket)
    order by m.created_at asc;
end;
$$;

revoke all on function wireless.lookup_ticket_media(text, text) from public;
grant execute on function wireless.lookup_ticket_media(text, text) to anon, authenticated;
