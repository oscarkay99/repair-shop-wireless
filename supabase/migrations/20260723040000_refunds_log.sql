-- A minimal refunds log: "Issue Refund" on the Payments page previously did
-- nothing. This records that a refund happened (who, how much, why, against
-- which transaction) for audit/reporting purposes. It intentionally does NOT
-- reverse any balance (invoice amount_paid, accessory_sales payment_status,
-- stock) — that's a separate, higher-stakes feature to build deliberately
-- once the reversal rules per source type are worked out.

create table wireless.refunds (
  id            uuid primary key default gen_random_uuid(),
  source_type   text not null check (source_type in ('sale', 'payment')),
  source_id     uuid not null,
  amount        numeric not null check (amount > 0),
  customer_name text,
  reference     text,
  reason        text,
  refunded_by   uuid references wireless.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index refunds_source_idx on wireless.refunds (source_type, source_id);

alter table wireless.refunds enable row level security;

create policy refunds_read on wireless.refunds for select to authenticated
  using (true);

create policy refunds_write on wireless.refunds for insert to authenticated
  with check (wireless.has_any_role(array['admin', 'sales_manager', 'receptionist']));

drop trigger if exists audit_refunds_changes on wireless.refunds;
create trigger audit_refunds_changes after insert or update or delete on wireless.refunds
  for each row execute procedure wireless.capture_audit_log();
