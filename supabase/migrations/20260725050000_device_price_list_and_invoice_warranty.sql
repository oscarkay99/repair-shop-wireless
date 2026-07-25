-- Device price list: lets the ticket form auto-suggest a repair cost once
-- the device model and issue are both filled in, instead of staff typing
-- the price from memory every time.
create table wireless.price_list (
  id           uuid primary key default gen_random_uuid(),
  device_model text not null,
  issue        text not null,
  price        numeric not null check (price >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index price_list_device_issue_idx
  on wireless.price_list (lower(device_model), lower(issue));

drop trigger if exists set_updated_at on wireless.price_list;
create trigger set_updated_at before update on wireless.price_list
  for each row execute function wireless.set_updated_at();

drop trigger if exists audit_price_list_changes on wireless.price_list;
create trigger audit_price_list_changes after insert or update or delete on wireless.price_list
  for each row execute procedure wireless.capture_audit_log();

alter table wireless.price_list enable row level security;

create policy "price_list_read" on wireless.price_list for select to authenticated
  using (wireless.is_active_user());
create policy "price_list_write" on wireless.price_list for all to authenticated
  using (wireless.has_any_role(array['admin','sales_manager']))
  with check (wireless.has_any_role(array['admin','sales_manager']));

-- Invoice warranty terms: the PDF/on-screen invoice always showed a
-- hardcoded "90-day warranty" line regardless of whether the linked ticket
-- was actually under warranty, or what warranty_days is actually set to in
-- Settings. Snapshotting both onto the invoice at creation time (rather than
-- a live join) means the invoice keeps showing the terms that applied when
-- it was issued, even if Settings' warranty_days changes later.
alter table wireless.invoices
  add column if not exists warranty boolean not null default false,
  add column if not exists warranty_days integer;
