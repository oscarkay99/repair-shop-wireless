-- Three related inventory-correctness fixes:
--
-- 1. deduct_part_stock (on wireless.ticket_parts insert) ran as SECURITY
--    INVOKER, so when a technician (the intended caller, per
--    ticket_parts_write) added a part to a ticket, the trigger's own
--    UPDATE wireless.parts was subject to RLS as *that technician* — who
--    has no parts_write grant. The UPDATE silently matched zero rows
--    (RLS filters, it doesn't error), so stock never actually moved. This
--    has presumably never worked for a technician; only admin/sales_manager
--    (who do have parts_write) would have seen it deduct.
--
-- 2. There was no way to reverse a ticket_parts row - removing a
--    wrongly-added part left the stock permanently short.
--
-- 3. Increasing a part's stock (new part with initial stock, or restocking
--    an existing one) never created a matching expense, even though it's
--    real money spent at cost price. Deductions (ticket consumption,
--    accessory sales) must NOT trigger this - only increases count as a
--    purchase.

create or replace function wireless.deduct_part_stock()
returns trigger
language plpgsql
security definer
set search_path = wireless, public
as $$
begin
  update wireless.parts
    set stock = greatest(0, stock - new.quantity), updated_at = now()
    where id = new.part_id;
  return new;
end;
$$;

create or replace function wireless.restore_part_stock()
returns trigger
language plpgsql
security definer
set search_path = wireless, public
as $$
begin
  update wireless.parts
    set stock = stock + old.quantity, updated_at = now()
    where id = old.part_id;
  return old;
end;
$$;

drop trigger if exists restore_part_stock on wireless.ticket_parts;
create trigger restore_part_stock
  after delete on wireless.ticket_parts
  for each row
  when (old.part_id is not null)
  execute function wireless.restore_part_stock();

create or replace function wireless.capture_restock_expense()
returns trigger
language plpgsql
security definer
set search_path = wireless, public
as $$
declare
  qty_added integer;
begin
  qty_added := case when TG_OP = 'INSERT' then new.stock else new.stock - old.stock end;
  if qty_added > 0 then
    insert into wireless.expenses (type, category, description, amount, vendor, notes, created_by)
    values (
      'expense',
      'Inventory Restock',
      qty_added || ' x ' || new.name || ' (' || new.sku || ')',
      qty_added * new.unit_cost,
      new.supplier,
      'Auto-logged from inventory restock',
      auth.uid()
    );
  end if;
  return new;
end;
$$;

-- Split into two triggers rather than one combined INSERT+UPDATE trigger:
-- a WHEN clause can't reference TG_OP (only the function body can), and an
-- OLD reference in WHEN isn't valid for a trigger that also fires on INSERT
-- (there is no OLD row yet).
drop trigger if exists capture_restock_expense_insert on wireless.parts;
create trigger capture_restock_expense_insert
  after insert on wireless.parts
  for each row
  when (new.stock > 0)
  execute function wireless.capture_restock_expense();

drop trigger if exists capture_restock_expense_update on wireless.parts;
create trigger capture_restock_expense_update
  after update of stock on wireless.parts
  for each row
  when (new.stock > old.stock)
  execute function wireless.capture_restock_expense();

-- Bundles the sale + line item + stock decrement into one atomic call so a
-- crash between steps can't leave a sale recorded with no matching stock
-- change (or vice versa), and so two concurrent sales of the last unit
-- can't both read the same starting stock and double-oversell it. Security
-- definer (bypasses accessory_sales_write/sale_items_write/parts_write),
-- so the role check has to happen inside the function instead of relying
-- on RLS the way the client-side version did.
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
begin
  if not wireless.has_any_role(array['admin','sales_manager']) then
    raise exception 'Unauthorized';
  end if;

  if p_product_id is not null then
    select stock into v_stock from wireless.parts where id = p_product_id for update;
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

  return query select s.id, s.sale_number, s.created_at from wireless.accessory_sales s where s.id = v_sale_id;
end;
$$;
