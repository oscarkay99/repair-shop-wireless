-- record_payment had no protection against a duplicate submission — a
-- network retry (request succeeds server-side but the response is lost) or
-- an accidental double-click past the button's disabled state would insert
-- a second payment row and double-credit the invoice/ticket balance, with
-- no way to tell it apart from two genuinely separate payments after the
-- fact. Add a short-window duplicate check: an identical payment (same
-- amount, method, target, and recorder) within the last 10 seconds returns
-- the original record instead of creating a second one. Narrow enough that
-- two real, separate payments of the same amount made minutes apart (a
-- common real scenario — repeat customers paying the same fee) are
-- unaffected.

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
  v_dupe_id uuid;
  v_invoice_total numeric;
  v_invoice_paid numeric;
begin
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
