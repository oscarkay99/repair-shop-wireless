-- Same "create/edit, never delete" rule just applied to Tickets, extended to
-- every other module receptionist has access to. Neither Customers nor
-- Invoices actually has a delete button in the UI today, but both
-- customers_write and invoices_write were single FOR ALL policies covering
-- every command including DELETE, with receptionist in the allowed-roles
-- list — a real gap reachable via a raw API call, same class already fixed
-- for tickets_delete. Splitting each into insert/update (receptionist kept)
-- and a separate delete policy (admin/sales_manager only).
--
-- Payments needed no change: wireless.payments has no update/delete policy
-- at all (an intentionally append-only ledger), so nobody — not even
-- admin — can delete a payment row through RLS.

drop policy if exists "customers_write" on wireless.customers;
create policy "customers_insert" on wireless.customers for insert to authenticated
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));
create policy "customers_update" on wireless.customers for update to authenticated
  using (wireless.has_any_role(array['admin','sales_manager','receptionist']))
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));
create policy "customers_delete" on wireless.customers for delete to authenticated
  using (wireless.has_any_role(array['admin','sales_manager']));

drop policy if exists "invoices_write" on wireless.invoices;
create policy "invoices_insert" on wireless.invoices for insert to authenticated
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));
create policy "invoices_update" on wireless.invoices for update to authenticated
  using (wireless.has_any_role(array['admin','sales_manager','receptionist']))
  with check (wireless.has_any_role(array['admin','sales_manager','receptionist']));
create policy "invoices_delete" on wireless.invoices for delete to authenticated
  using (wireless.has_any_role(array['admin','sales_manager']));
