-- record_accessory_sale's RETURNS TABLE(id uuid, ...) implicitly declares
-- `id` as a PL/pgSQL variable in scope for the whole function body. The
-- unqualified `where id = p_product_id` in both the stock SELECT and the
-- stock UPDATE was therefore ambiguous between that output variable and
-- wireless.parts.id, breaking every accessory sale with a linked product
-- ("column reference \"id\" is ambiguous"). Same fix already applied to the
-- accessory_sales INSERT...RETURNING further down this function — fully
-- qualifying the column, not just aliasing it, for consistency with that.

create or replace function wireless.record_accessory_sale(p_product_id uuid, p_product_name text, p_quantity integer, p_unit_price numeric, p_total numeric, p_payment_method text, p_customer_id uuid default null::uuid, p_customer_name text default ''::text)
returns table(id uuid, sale_number text, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'wireless', 'public'
as $function$
declare
  v_sale_id uuid;
  v_stock integer;
  v_unit_cost numeric;
  v_part_name text;
begin
  if not wireless.has_permission('sales:create') then
    raise exception 'Unauthorized';
  end if;

  if p_product_id is not null then
    select stock, unit_cost, name into v_stock, v_unit_cost, v_part_name
      from wireless.parts where wireless.parts.id = p_product_id for update;
    if v_stock is null then
      raise exception 'Product not found';
    end if;
    update wireless.parts set stock = greatest(0, v_stock - p_quantity), updated_at = now()
      where wireless.parts.id = p_product_id;
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
$function$;
