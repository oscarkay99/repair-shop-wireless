-- Let staff sign in with either their email or a username. GoTrue itself
-- only authenticates by email, so a username is just an alias resolved to
-- its email before the real password check happens — the password check
-- (and the existing active-status gate) is unaffected either way.

alter table wireless.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique_idx on wireless.profiles (lower(username)) where username is not null and username != '';

-- Separate rate-limit bucket from wireless.lookup_rate_limit (ticket
-- lookup) — sharing one bucket would let a shop's shared office IP throttle
-- staff logins and customer ticket lookups against each other.
create table if not exists wireless.login_lookup_rate_limit (
  ip           text primary key,
  window_start timestamptz not null default now(),
  attempts     int not null default 0
);
alter table wireless.login_lookup_rate_limit enable row level security;
-- No policies granted: only the SECURITY DEFINER function below ever touches this table.

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

  -- Already an email — nothing to resolve, GoTrue does the real check.
  if v_id like '%@%' then
    return v_id;
  end if;

  v_ip := coalesce(
    nullif(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1), ''),
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

revoke all on function wireless.resolve_login_email(text) from public;
grant execute on function wireless.resolve_login_email(text) to anon, authenticated;
