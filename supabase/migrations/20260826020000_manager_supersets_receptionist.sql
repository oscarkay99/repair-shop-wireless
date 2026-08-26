-- Esther needs to do both the receptionist job and manager-level oversight,
-- but a profile carries exactly one role, and receptionist/manager use
-- different dashboard shells (receptionist gets the bundled sidebar-less
-- /reception portal; manager gets the full admin-style sidebar with each
-- page separate). No profile can be "both" at once.
--
-- Fix: make manager a strict superset of receptionist's permissions —
-- 'manager' currently has almost everything 'receptionist' does already
-- (see 20260801030000_manager_role.sql), missing only
-- ticket_comments:create, ticket_parts:create, payments:view, and
-- parts:view. Adding those means anyone on 'manager' can do everything a
-- receptionist can (via the full sidebar, which is strictly more capable
-- than the bundled portal, not less) plus the existing manager-only scope
-- (technicians:edit, team:view, expenses:view). Safe to change in place:
-- no profile currently carries the 'manager' role, so this has no blast
-- radius on anyone else.
update wireless.roles
set permissions = array[
  'tickets:view','tickets:create','tickets:edit',
  'ticket_media:view',
  'ticket_comments:view','ticket_comments:create',
  'ticket_parts:view','ticket_parts:create',
  'customers:create','customers:edit',
  'invoices:create','invoices:edit','invoices:items_edit',
  'technicians:edit',
  'sales:create',
  'payments:create','payments:view',
  'parts:view',
  'team:view',
  'expenses:view'
]
where id = 'manager';

update wireless.profiles set role = 'manager' where email = 'esther.wirelesscare@gmail.com';
