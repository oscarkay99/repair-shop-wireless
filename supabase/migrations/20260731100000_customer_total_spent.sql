-- wireless.customers.total_spent has never been written to by anything —
-- it sits at its DEFAULT 0 for every customer forever, repair or
-- accessory, paid or not. Neither the payments ledger (wireless.payments,
-- the actual source of truth for repair-invoice/ticket-deposit money) nor
-- wireless.accessory_sales ever updates it. Backfill it from current state,
-- then keep it live going forward with two AFTER INSERT triggers — one per
-- money-in path — mirroring how ticket_count is already maintained by
-- increment_customer_ticket_count() below.

-- One-time backfill. Uses invoices.amount_paid (authoritative regardless of
-- whether a given payment predates the payments ledger migration) rather
-- than summing wireless.payments directly, so pre-ledger history isn't
-- lost. Accessory sales are always recorded paid-in-full at sale time, so
-- summing `total` is equivalent to summing amount_paid there.
with spend as (
  select customer_id, sum(amount_paid) as amt
  from wireless.invoices
  where customer_id is not null
  group by customer_id
  union all
  select customer_id, sum(total) as amt
  from wireless.accessory_sales
  where customer_id is not null
  group by customer_id
)
update wireless.customers c
set total_spent = coalesce((select sum(amt) from spend where spend.customer_id = c.id), 0);

create or replace function wireless.increment_customer_spend_from_payment()
returns trigger language plpgsql as $$
begin
  if new.customer_id is not null then
    update wireless.customers
    set total_spent = total_spent + new.amount, updated_at = now()
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists increment_customer_spend_from_payment on wireless.payments;
create trigger increment_customer_spend_from_payment
  after insert on wireless.payments
  for each row execute function wireless.increment_customer_spend_from_payment();

create or replace function wireless.increment_customer_spend_from_sale()
returns trigger language plpgsql as $$
begin
  if new.customer_id is not null then
    update wireless.customers
    set total_spent = total_spent + new.total, updated_at = now()
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists increment_customer_spend_from_sale on wireless.accessory_sales;
create trigger increment_customer_spend_from_sale
  after insert on wireless.accessory_sales
  for each row execute function wireless.increment_customer_spend_from_sale();
