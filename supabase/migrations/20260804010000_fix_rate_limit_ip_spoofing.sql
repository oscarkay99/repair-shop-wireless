-- SECURITY FIX: the three public rate-limited RPCs (lookup_ticket,
-- lookup_ticket_media, resolve_login_email) keyed their per-IP bucket off
-- x-forwarded-for, taking the FIRST comma-separated segment. nginx's
-- `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` APPENDS the
-- real client IP to whatever XFF value the client already sent — it never
-- strips a client-supplied one. A caller can therefore set their own
-- X-Forwarded-For to a fresh random value on every request and land in a
-- brand new rate-limit bucket every time, fully bypassing the 8-attempts/
-- 20-attempts-per-5-minutes limits and enabling unlimited brute-force
-- enumeration of tickets/phone numbers/usernames.
--
-- Fix: key off X-Real-IP instead. nginx sets that header with
-- `proxy_set_header X-Real-IP $remote_addr` — a plain overwrite, not an
-- append — so it always reflects the true TCP connection IP no matter what
-- the client sends, and is not attacker-controllable.

create or replace function wireless.lookup_ticket(p_ticket_number text default null, p_phone text default null)
returns table (
  ticket_number text,
  device        text,
  device_type   text,
  issue         text,
  status        text,
  eta           text,
  cost_label    text,
  warranty      boolean,
  created_at    timestamptz,
  completed_at  timestamptz,
  job_type      text,
  service_stage text,
  diagnosis     text,
  quote_status  text,
  quote_amount  numeric
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

  return query
    select
      t.ticket_number, t.device, t.device_type, t.issue, t.status,
      t.eta, t.cost_label, t.warranty, t.created_at, t.completed_at,
      t.job_type, t.service_stage, t.diagnosis, t.quote_status, t.quote_amount
    from wireless.tickets t
    where
      lower(t.ticket_number) = lower(v_ticket)
      and right(regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g'), 9) = right(v_phone_norm, 9)
    order by t.created_at desc
    limit 20;
end;
$$;

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
    select m.stage, m.media_type, m.file_url, m.thumbnail_url, m.caption, m.created_at
    from wireless.ticket_media m
    where lower(m.ticket_number) = lower(v_ticket)
    order by m.created_at asc;
end;
$$;

create or replace function wireless.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = wireless as $$
declare
  v_ip        text;
  v_window    interval := interval '5 minutes';
  v_max_tries int := 20;
  v_attempts  int;
  v_id        text := lower(trim(coalesce(p_identifier, '')));
begin
  if v_id = '' then
    return null;
  end if;

  if v_id like '%@%' then
    return v_id;
  end if;

  v_ip := coalesce(
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-real-ip', ''),
    'unknown'
  );

  insert into wireless.login_lookup_rate_limit as rl (ip, window_start, attempts)
  values (v_ip, now(), 1)
  on conflict (ip) do update set
    attempts     = case when rl.window_start < now() - v_window then 1 else rl.attempts + 1 end,
    window_start = case when rl.window_start < now() - v_window then now() else rl.window_start end
  returning rl.attempts into v_attempts;

  if v_attempts > v_max_tries then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;

  return (select email from wireless.profiles where lower(username) = v_id limit 1);
end;
$$;
