-- Public, unauthenticated ticket lookup for the customer portal.
--
-- The portal must never get a direct grant on wireless.tickets: with RLS,
-- grants apply per-role, not per-query, so an "anon can SELECT" policy would
-- let anyone pull every row in the table straight from the REST API, bypassing
-- whatever the UI's search box does client-side. Instead, expose a single
-- SECURITY DEFINER function that requires an exact ticket number or phone
-- match and returns only customer-safe columns (no cost breakdown internals,
-- no notes, no other customers' contact info).

create or replace function wireless.lookup_ticket(p_ticket_number text default null, p_phone text default null)
returns table (
  ticket_number text,
  device        text,
  device_type   text,
  issue         text,
  status        text,
  technician    text,
  eta           text,
  cost_label    text,
  warranty      boolean,
  created_at    timestamptz,
  completed_at  timestamptz
)
language sql
security definer
set search_path = wireless, public
stable
as $$
  select
    t.ticket_number, t.device, t.device_type, t.issue, t.status,
    t.technician_name, t.eta, t.cost_label, t.warranty, t.created_at, t.completed_at
  from wireless.tickets t
  where
    (p_ticket_number is not null and length(trim(p_ticket_number)) > 0
       and lower(t.ticket_number) = lower(trim(p_ticket_number)))
    or
    (p_phone is not null and length(regexp_replace(p_phone, '[^0-9]', '', 'g')) >= 6
       and right(regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g'), 9)
           = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 9))
  order by t.created_at desc
  limit 20;
$$;

revoke all on function wireless.lookup_ticket(text, text) from public;
grant execute on function wireless.lookup_ticket(text, text) to anon, authenticated;
