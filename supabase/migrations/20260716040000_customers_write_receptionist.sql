-- Receptionists create/find customers as part of the ticket-intake flow (see
-- tickets_insert/tickets_update), but customers_write was never updated to match
-- when sales_rep was retired in favor of receptionist — it still only allows
-- admin/sales_manager, silently blocking receptionists from adding or editing
-- customer records.
drop policy if exists customers_write on wireless.customers;
create policy customers_write on wireless.customers
  for all
  using (wireless.has_any_role(array['admin', 'sales_manager', 'receptionist']))
  with check (wireless.has_any_role(array['admin', 'sales_manager', 'receptionist']));
