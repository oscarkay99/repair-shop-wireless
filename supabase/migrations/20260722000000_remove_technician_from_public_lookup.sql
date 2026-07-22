-- Staff decided customers shouldn't see which technician is assigned to
-- their ticket. Drop the column from the RPC's return set entirely rather
-- than just hiding it in the frontend — the anon key is public and this
-- RPC is directly callable over REST, so the only real fix is to stop
-- sending the field at all.

drop function if exists wireless.lookup_ticket(text, text);

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

revoke all on function wireless.lookup_ticket(text, text) from public;
grant execute on function wireless.lookup_ticket(text, text) to anon, authenticated;
