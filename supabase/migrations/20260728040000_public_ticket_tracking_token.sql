-- Scanning the receipt/invoice QR still required typing a phone number
-- before showing anything — by design, since the URL only ever carried the
-- ticket_number, which is sequential and guessable (see the doc comment on
-- lookup_ticket). A random, unguessable per-ticket token sidesteps that:
-- unlike the ticket number, it can't be enumerated, so knowing it is
-- sufficient proof on its own — no phone match, no rate limit needed.
--
-- Existing tickets get a token backfilled by the column default so nothing
-- is left without one; the QR-generating code (staff app) switches to
-- encoding this token instead of the ticket number.

alter table wireless.tickets
  add column if not exists public_token uuid not null default gen_random_uuid();

create unique index if not exists tickets_public_token_idx on wireless.tickets (public_token);

comment on column wireless.tickets.public_token is
  'Random, unguessable per-ticket secret embedded in the tracker QR code on printed receipts/invoices — a scan authenticates on its own (the token itself proves possession of the physical document), unlike the sequential/guessable ticket_number.';

create or replace function wireless.lookup_ticket_by_token(p_token uuid)
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
begin
  if p_token is null then
    return;
  end if;

  return query
    select
      t.ticket_number, t.device, t.device_type, t.issue, t.status,
      t.eta, t.cost_label, t.warranty, t.created_at, t.completed_at,
      t.job_type, t.service_stage, t.diagnosis, t.quote_status, t.quote_amount
    from wireless.tickets t
    where t.public_token = p_token
    limit 1;
end;
$$;

revoke all on function wireless.lookup_ticket_by_token(uuid) from public;
grant execute on function wireless.lookup_ticket_by_token(uuid) to anon, authenticated;

create or replace function wireless.lookup_ticket_media_by_token(p_token uuid)
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
begin
  if p_token is null then
    return;
  end if;

  return query
    select m.stage, m.media_type, m.file_url, m.thumbnail_url, m.caption, m.created_at
    from wireless.ticket_media m
    join wireless.tickets t on lower(t.ticket_number) = lower(m.ticket_number)
    where t.public_token = p_token
    order by m.created_at asc;
end;
$$;

revoke all on function wireless.lookup_ticket_media_by_token(uuid) from public;
grant execute on function wireless.lookup_ticket_media_by_token(uuid) to anon, authenticated;
