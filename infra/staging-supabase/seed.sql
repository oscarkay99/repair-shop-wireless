\set ON_ERROR_STOP on

-- Synthetic fixtures only. These identifiers and contact details are reserved
-- for staging and must never be copied into production.
insert into wireless.customers (
  id, name, phone, email, address, notes
) values (
  '10000000-0000-4000-8000-000000000001',
  'Staging Payment Customer',
  '0240000000',
  'paystack-test@wirelesscares.com',
  'Staging only',
  'Synthetic Paystack integration fixture'
)
on conflict (id) do nothing;

insert into wireless.tickets (
  id, ticket_number, customer_id, customer_name, customer_email,
  customer_phone, device, brand, model, issue, estimated_cost,
  device_type, job_type, service_stage, status, cost_label, public_token
) values (
  '20000000-0000-4000-8000-000000000001',
  'TEST-PAY-0001',
  '10000000-0000-4000-8000-000000000001',
  'Staging Payment Customer',
  'paystack-test@wirelesscares.com',
  '0240000000',
  'Synthetic Test Phone',
  'Wireless',
  'Staging',
  'Paystack integration testing only',
  1000,
  'Phone',
  'straight_repair',
  'repair',
  'in_progress',
  'GHS 1,000.00',
  '30000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into wireless.invoices (
  id, invoice_number, ticket_id, customer_id, subtotal, tax,
  discount, total, amount_paid, status, notes
) values (
  '40000000-0000-4000-8000-000000000001',
  'TEST-INV-0001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  1000, 0, 0, 1000, 0, 'unpaid',
  'Synthetic Paystack integration invoice'
)
on conflict (id) do nothing;
