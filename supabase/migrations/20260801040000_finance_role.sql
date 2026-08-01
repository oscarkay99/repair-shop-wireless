-- New "Finance" role: money-side oversight — payments, invoices (view/
-- reconcile), expenses & P&L, and the audit trail for financial changes.
-- Deliberately excludes ticket/customer/sales operational permissions
-- (that's Manager's job) and inventory (stock_manager/inventory_manager's).
-- dashboard_variant 'admin' gives the full-overview dashboard; the nav
-- itself is still scoped down to just what this permission set unlocks
-- (Payments, Invoices, Expenses & P&L, Audit Logs).
insert into wireless.roles (id, name, color, permissions, scope_tickets_to_technician, dashboard_variant, is_system)
values (
  'finance', 'Finance', '#22C55E',
  array[
    'payments:create',
    'invoices:edit','invoices:items_edit',
    'expenses:view','expenses:edit',
    'audit_logs:view'
  ],
  false, 'admin', false
)
on conflict (id) do nothing;
