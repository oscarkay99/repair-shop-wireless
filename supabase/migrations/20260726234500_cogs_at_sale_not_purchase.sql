-- Switches profit tracking from "expense at purchase" to "expense at sale"
-- (COGS - cost of goods sold). The previous model (capture_restock_expense,
-- added a few hours ago) expensed a part's cost the moment stock went up,
-- which double-counts against a proper profit figure and makes the P&L
-- lumpy - a month where you restock heavily but sell little looks like a
-- big loss even though nothing's wrong. Inventory sitting on the shelf
-- isn't a cost yet; it becomes one only when it's actually sold or used in
-- a paid job, matched against the revenue it produced.

drop trigger if exists capture_restock_expense_insert on wireless.parts;
drop trigger if exists capture_restock_expense_update on wireless.parts;
drop function if exists wireless.capture_restock_expense();

-- Accessory sales are created already 'paid' (retail, paid at the counter),
-- so COGS is recognized in the same transaction as the sale itself.
create or replace function wireless.record_accessory_sale(
  p_product_id uuid,
  p_product_name text,
  p_quantity integer,
  p_unit_price numeric,
  p_total numeric,
  p_payment_method text,
  p_customer_id uuid default null,
  p_customer_name text default ''
)
returns table (id uuid, sale_number text, created_at timestamptz)
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_sale_id uuid;
  v_stock integer;
  v_unit_cost numeric;
  v_part_name text;
begin
  if not wireless.has_any_role(array['admin','sales_manager']) then
    raise exception 'Unauthorized';
  end if;

  if p_product_id is not null then
    select stock, unit_cost, name into v_stock, v_unit_cost, v_part_name
      from wireless.parts where id = p_product_id for update;
    if v_stock is null then
      raise exception 'Product not found';
    end if;
    update wireless.parts set stock = greatest(0, v_stock - p_quantity), updated_at = now()
      where id = p_product_id;
  end if;

  insert into wireless.accessory_sales
    (customer_id, customer_name, subtotal, discount, tax, total, payment_method, payment_status, amount_paid, sold_by)
  values
    (p_customer_id, coalesce(p_customer_name, ''), p_total, 0, 0, p_total, lower(p_payment_method), 'paid', p_total, auth.uid())
  returning wireless.accessory_sales.id into v_sale_id;

  insert into wireless.sale_items (sale_id, part_id, item_name, quantity, unit_price, total_price)
  values (v_sale_id, p_product_id, p_product_name, p_quantity, p_unit_price, p_total);

  if p_product_id is not null and v_unit_cost > 0 then
    insert into wireless.expenses (type, category, description, amount, notes, created_by)
    values (
      'expense',
      'Cost of Goods Sold',
      p_quantity || ' x ' || coalesce(v_part_name, p_product_name) || ' sold',
      p_quantity * v_unit_cost,
      'Auto-logged COGS for accessory sale ' || v_sale_id,
      auth.uid()
    );
  end if;

  return query select s.id, s.sale_number, s.created_at from wireless.accessory_sales s where s.id = v_sale_id;
end;
$$;

-- Ticket-based repairs: parts get consumed (stock deducted) while the job is
-- being worked, but the customer hasn't necessarily paid yet - COGS should
-- only hit the books once the invoice is actually paid in full, matched
-- against the revenue it just produced. Fires on whatever code path marks
-- an invoice paid (record_payment, patchInvoice, auto-invoice re-totaling),
-- since they all resolve to the same UPDATE on wireless.invoices.
create or replace function wireless.capture_ticket_cogs()
returns trigger
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  v_cogs numeric;
  v_marker text;
begin
  if new.ticket_id is null then
    return new;
  end if;

  select coalesce(sum(quantity * unit_cost), 0) into v_cogs
    from wireless.ticket_parts where ticket_id = new.ticket_id;

  if v_cogs <= 0 then
    return new;
  end if;

  -- Guards against double-logging if an invoice bounces paid -> partial/
  -- unpaid -> paid again (e.g. a disputed payment corrected later).
  v_marker := 'Auto-logged COGS for ticket ' || new.ticket_id;
  if exists (select 1 from wireless.expenses where category = 'Cost of Goods Sold' and notes = v_marker) then
    return new;
  end if;

  insert into wireless.expenses (type, category, description, amount, notes, created_by)
  values (
    'expense',
    'Cost of Goods Sold',
    'Parts used on ticket ' || new.ticket_id,
    v_cogs,
    v_marker,
    auth.uid()
  );

  return new;
end;
$$;

drop trigger if exists capture_ticket_cogs_insert on wireless.invoices;
create trigger capture_ticket_cogs_insert
  after insert on wireless.invoices
  for each row
  when (new.status = 'paid')
  execute function wireless.capture_ticket_cogs();

drop trigger if exists capture_ticket_cogs_update on wireless.invoices;
create trigger capture_ticket_cogs_update
  after update of status on wireless.invoices
  for each row
  when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function wireless.capture_ticket_cogs();
