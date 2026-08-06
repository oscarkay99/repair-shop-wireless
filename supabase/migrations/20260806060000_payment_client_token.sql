-- The previous idempotency guard (20260806020000) matched on amount/method/
-- invoice_id/ticket_id/recorded_by within a 10s window — but the split-
-- payment feature (RecordPaymentModal, InvoicesPanel) reuses the exact same
-- reference/invoice/ticket across every split in one submission, so two
-- genuinely different splits of the same amount and method (e.g. two GHS 50
-- cash payments from two customers sharing a bill) collapsed into one row.
-- The submit button is already disabled while saving, so accidental
-- double-clicks were never really the risk this needed to cover — the only
-- real risk is a lost-response retry of one specific call, which a
-- per-call client-generated token protects against precisely, without
-- guessing from field equality.

alter table wireless.payments add column if not exists client_token uuid;
create unique index if not exists payments_client_token_idx
  on wireless.payments (client_token) where client_token is not null;

-- Adding a parameter changes the function's identity (arg type list), so
-- CREATE OR REPLACE would create a second overload instead of replacing
-- this — drop the old 8-arg signature first.
drop function if exists wireless.record_payment(numeric, text, uuid, uuid, uuid, text, text, text);

create function wireless.record_payment(
  p_amount numeric,
  p_method text,
  p_invoice_id uuid default null,
  p_ticket_id uuid default null,
  p_customer_id uuid default null,
  p_customer_name text default '',
  p_reference text default null,
  p_notes text default null,
  p_client_token uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_dupe_id uuid;
  v_invoice_total numeric;
  v_invoice_paid numeric;
begin
  if p_client_token is not null then
    select id into v_dupe_id from wireless.payments where client_token = p_client_token;
    if v_dupe_id is not null then
      return v_dupe_id;
    end if;
  else
    select id into v_dupe_id
    from wireless.payments
    where amount = p_amount
      and method = p_method
      and invoice_id is not distinct from p_invoice_id
      and ticket_id is not distinct from p_ticket_id
      and recorded_by is not distinct from auth.uid()
      and created_at > now() - interval '10 seconds'
    order by created_at desc
    limit 1;

    if v_dupe_id is not null then
      return v_dupe_id;
    end if;
  end if;

  begin
    insert into wireless.payments (amount, method, invoice_id, ticket_id, customer_id, customer_name, reference, notes, recorded_by, client_token)
    values (p_amount, p_method, p_invoice_id, p_ticket_id, p_customer_id, p_customer_name, p_reference, p_notes, auth.uid(), p_client_token)
    returning id into v_id;
  exception when unique_violation then
    -- Two requests carrying the same token raced each other past the
    -- lookup above — the loser here just returns the winner's row.
    select id into v_id from wireless.payments where client_token = p_client_token;
    return v_id;
  end;

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
