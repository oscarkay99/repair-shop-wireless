-- The user had already self-created a 'manager' role via Settings, but its
-- permissions were a mixed grab-bag (including parts:edit/parts:create —
-- the reception+inventory blend explicitly called out as "not really
-- working" in the same conversation) and dashboard_variant was set to
-- 'receptionist', which locks any role down to the narrow single-purpose
-- reception portal rather than giving a broad overview. Replaces both with
-- a coherent set: oversight across technicians, reception (tickets,
-- invoices, customers, bookings), and sales — explicitly no inventory —
-- landing on the full-overview admin dashboard.
update wireless.roles
set
  dashboard_variant = 'admin',
  permissions = array[
    'tickets:view','tickets:create','tickets:edit',
    'ticket_media:view',
    'ticket_comments:view',
    'ticket_parts:view',
    'customers:create','customers:edit',
    'invoices:create','invoices:edit','invoices:items_edit',
    'technicians:edit',
    'sales:create',
    'payments:create',
    'team:view',
    'expenses:view'
  ]
where id = 'manager';
