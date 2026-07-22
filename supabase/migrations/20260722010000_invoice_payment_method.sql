-- Invoices had no payment-method concept at all (unlike accessory_sales,
-- which already tracks Cash/Card/MoMo/Bank Transfer). Reusing that same
-- vocabulary here rather than inventing a new one, so the whole app speaks
-- one payment-method language.
alter table wireless.invoices add column if not exists payment_method text;
alter table wireless.invoices drop constraint if exists invoices_payment_method_check;
alter table wireless.invoices add constraint invoices_payment_method_check
  check (payment_method is null or payment_method in ('Cash','Card','MoMo','Bank Transfer'));
