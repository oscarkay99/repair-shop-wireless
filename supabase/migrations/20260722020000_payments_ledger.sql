-- A real payments module: an append-only ledger, not just a report.
-- Today payment info is scattered — accessory_sales captures it at sale
-- time (unchanged here), invoices only ever overwrite one amount_paid
-- field (no partial-payment history), and wireless.tickets already has
-- deposit_paid/diagnosis_fee/payments_json columns that nothing has ever
-- read or written. This adds wireless.payments as the source of truth for
-- payments recorded through the app, linkable to an invoice, a ticket, or
-- neither (a standalone/walk-in payment).

create table wireless.payments (
  id            uuid primary key default gen_random_uuid(),
  amount        numeric not null check (amount > 0),
  method        text not null check (method in ('Cash','Card','MoMo','Bank Transfer')),
  invoice_id    uuid references wireless.invoices(id) on delete set null,
  ticket_id     uuid references wireless.tickets(id) on delete set null,
  customer_id   uuid references wireless.customers(id) on delete set null,
  customer_name text not null default '',
  reference     text,
  notes         text,
  recorded_by   uuid references wireless.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint payments_single_target check (
    (case when invoice_id is not null then 1 else 0 end)
    + (case when ticket_id is not null then 1 else 0 end) <= 1
  )
);

create index payments_created_at_idx on wireless.payments (created_at desc);
create index payments_invoice_idx on wireless.payments (invoice_id);
create index payments_ticket_idx on wireless.payments (ticket_id);

alter table wireless.payments enable row level security;

create policy payments_read on wireless.payments for select to authenticated
  using (true);

create policy payments_write on wireless.payments for insert to authenticated
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));

drop trigger if exists audit_payments_changes on wireless.payments;
create trigger audit_payments_changes after insert or update or delete on wireless.payments
  for each row execute procedure wireless.capture_audit_log();

-- Bundles the ledger insert with the target rollup update in one call.
-- security invoker (default) — both writes stay subject to normal RLS for
-- whoever calls it, this just makes the pair atomic.
create or replace function wireless.record_payment(
  p_amount numeric,
  p_method text,
  p_invoice_id uuid default null,
  p_ticket_id uuid default null,
  p_customer_id uuid default null,
  p_customer_name text default '',
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_invoice_total numeric;
  v_invoice_paid numeric;
begin
  insert into wireless.payments (amount, method, invoice_id, ticket_id, customer_id, customer_name, reference, notes, recorded_by)
  values (p_amount, p_method, p_invoice_id, p_ticket_id, p_customer_id, p_customer_name, p_reference, p_notes, auth.uid())
  returning id into v_id;

  if p_invoice_id is not null then
    select total, amount_paid into v_invoice_total, v_invoice_paid
    from wireless.invoices where id = p_invoice_id;

    update wireless.invoices
    set amount_paid = coalesce(v_invoice_paid, 0) + p_amount,
        status = case when coalesce(v_invoice_paid, 0) + p_amount >= v_invoice_total then 'paid' else 'partial' end,
        payment_method = p_method,
        updated_at = now()
    where id = p_invoice_id;
  end if;

  if p_ticket_id is not null then
    update wireless.tickets
    set deposit_paid = coalesce(deposit_paid, 0) + p_amount,
        updated_at = now()
    where id = p_ticket_id;
  end if;

  return v_id;
end;
$$;

-- Close two RLS gaps the DB was stricter about than the frontend's own
-- permission model already promises (receptionist has the 'Invoices'
-- module, sales_manager has the 'Tickets' module — neither could actually
-- write there), both needed for payment recording to work for those roles.

drop policy if exists "invoices_write" on wireless.invoices;
create policy "invoices_write" on wireless.invoices for all to authenticated
  using (wireless.has_any_role(array['admin','sales_manager','receptionist']))
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));

drop policy if exists "tickets_update" on wireless.tickets;
create policy "tickets_update" on wireless.tickets for update to authenticated
  using (
    wireless.has_any_role(array['admin','receptionist','sales_manager'])
    or (wireless.current_user_role() = 'technician'
        and technician_id = (select id from wireless.technicians where profile_id = auth.uid() limit 1))
  )
  with check (
    wireless.has_any_role(array['admin','receptionist','sales_manager'])
    or wireless.current_user_role() = 'technician'
  );

-- Dead role name left over from before today's inventory_manager merge —
-- can never match now that the role no longer exists, harmless but tidy.
drop policy if exists tickets_read on wireless.tickets;
create policy tickets_read on wireless.tickets for select to authenticated using (
  wireless.has_any_role(array['admin','receptionist','sales_manager'])
  or (
    wireless.current_user_role() = 'technician'
    and technician_id is not null
    and technician_id = wireless.my_technician_id()
  )
);
