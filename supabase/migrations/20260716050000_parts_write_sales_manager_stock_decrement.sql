-- Recording an accessory sale must decrement the sold part's stock, but parts_write
-- only allowed admin/inventory_manager — sales_manager (who actually records sales
-- on the Accessories Sales page) was silently blocked by RLS from updating stock.
drop policy if exists parts_write on wireless.parts;
create policy parts_write on wireless.parts
  for all
  using (wireless.has_any_role(array['admin', 'inventory_manager', 'sales_manager']))
  with check (wireless.has_any_role(array['admin', 'inventory_manager', 'sales_manager']));
