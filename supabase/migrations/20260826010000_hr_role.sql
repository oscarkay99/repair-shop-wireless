-- Adds a self-service-style HR role, same shape as any role an admin could
-- create via Settings > Team & Roles > Add Role (see RoleFormModal.tsx /
-- 20260727000000_custom_roles_system.sql for the permission catalog this
-- draws from) — done here via migration instead so it's tracked and applied
-- consistently, same as 20260801030000_manager_role.sql did for 'manager'.
--
-- Scoped to what's actually real and staff-facing in the app today:
-- attendance:view/manage (the Attendance page) and technicians:edit (the
-- Technicians roster page — view + edit contact info/specialty). Explicitly
-- does NOT include settings:edit or anything admin-only — Settings > Team &
-- Roles and Settings > Users stay hardcoded to true admins only
-- (settings/page.tsx's allSections adminOnly flag), regardless of any
-- permission granted here, so this role can't invite staff, edit other
-- roles' permissions, or touch Tickets/Sales/Invoices/Inventory/Payments.
-- dashboard_variant 'admin' lands them on the normal full-overview
-- dashboard (not a narrow single-purpose portal) — canAccessModule then
-- naturally narrows their visible sidebar to just Dashboard, Technicians,
-- and Attendance based on the permissions below.
insert into wireless.roles (id, name, color, permissions, scope_tickets_to_technician, dashboard_variant, is_system)
values (
  'hr',
  'HR',
  '#3B82F6',
  array['attendance:view', 'attendance:manage', 'technicians:edit', 'team:view'],
  false,
  'admin',
  false
)
on conflict (id) do nothing;
