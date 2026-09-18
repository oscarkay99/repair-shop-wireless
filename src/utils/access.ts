import type { AuthUser } from '@/hooks/useAuth';

export type AppModule =
  | 'Dashboard'
  | 'Analytics'
  | 'AI Studio'
  | 'Audit Logs'
  | 'Inventory'
  | 'Payments'
  | 'Customers'
  | 'Tickets'
  | 'Repairs'
  | 'Technicians'
  | 'Invoices'
  | 'Sales'
  | 'Activity'
  | 'Technician Portal'
  | 'Reception Portal'
  | 'Inventory Portal'
  | 'Warranty'
  | 'Delivery'
  | 'Expenses'
  | 'Attendance'
  | 'HR'
  | 'Reports'
  | 'Loyalty'
  | 'Team'
  | 'Settings'
  | 'Authentication'
  | 'Users';

// A handful of nav items (Analytics, Reports, AI Studio, etc.) are
// demo/template pages with no backing wireless.* table or RLS policy — there
// is no real permission to derive their visibility from, so it's preserved
// exactly as it was under the old fixed 4-role map. Custom roles simply
// don't see them (only admin/sales_manager/technician get what they always
// had). Everything else below is genuinely permission-driven.
const LEGACY_MODULE_VISIBILITY: Partial<Record<AppModule, string[]>> = {
  Analytics: ['admin', 'sales_manager'],
  'AI Studio': ['admin'],
  Reports: ['admin', 'sales_manager'],
  Loyalty: ['admin', 'sales_manager'],
  Delivery: ['admin', 'sales_manager'],
  Warranty: ['admin', 'technician'],
  Authentication: ['admin'],
  Activity: ['admin'],
  Users: ['admin'],
};

type PermCtx = Pick<AuthUser, 'role' | 'permissions' | 'scopeTicketsToTechnician'> | null | undefined;

export function canViewAdminDashboard(user: PermCtx): boolean {
  return !!user && (user.role === 'admin' || user.role === 'manager');
}

/**
 * The only supported post-login destinations. Unknown roles/variants fail
 * closed instead of inheriting the most privileged dashboard.
 */
export function getLandingPath(user: PermCtx): string {
  if (!user?.role) return '/access-denied';
  switch (user.role) {
    case 'admin':
    case 'manager':
    case 'sales_manager':
      return '/';
    case 'technician':
      return '/tech-portal';
    case 'receptionist':
      return '/reception';
    case 'stock_manager':
    case 'inventory_manager':
      return '/inventory-portal';
    case 'hr':
      return '/hr';
    case 'finance':
      return '/expenses';
    default:
      return '/access-denied';
  }
}

export function canAccessModule(user: PermCtx, module: AppModule): boolean {
  if (!user?.role) return false;
  const perms = new Set(user.permissions ?? []);
  const has = (p: string) => perms.has(p);

  switch (module) {
    case 'Dashboard':
      return getLandingPath(user) !== '/access-denied';
    case 'Tickets':
    case 'Repairs':
      return !!user.scopeTicketsToTechnician || has('tickets:view') || has('tickets:create') || has('tickets:edit') || has('tickets:delete');
    case 'Customers':
      return has('customers:view') || has('customers:create') || has('customers:edit') || has('customers:delete');
    case 'Inventory':
      return has('parts:edit') || has('parts:create') || has('parts:view');
    // Permission-based, not a hardcoded role id — same fix as Portal above.
    // technicians:edit alone would under-grant: reads on wireless.technicians
    // are open to any active user at the RLS layer (writes are the part
    // gated on technicians:edit), and receptionist's real reason for needing
    // this page is ticket assignment, not technician management — so ticket
    // permissions imply access here too, matching what reception already had.
    case 'Technicians':
      return has('technicians:view') || has('technicians:edit') || has('tickets:view') || has('tickets:create') || has('tickets:edit') || has('tickets:delete');
    case 'Payments':
      return has('payments:view') || has('payments:create');
    case 'Invoices':
      return has('invoices:view') || has('invoices:create') || has('invoices:edit') || has('invoices:delete') || has('invoices:items_edit');
    case 'Sales':
      return has('sales:view') || has('sales:create');
    case 'Expenses':
      return has('expenses:view') || has('expenses:edit') || has('assets:view') || has('assets:edit');
    // Admin is a protected system role that can't carry a DB-seeded
    // attendance:* permission (trg_prevent_system_role_mutation blocks any
    // update to it) — wireless.has_permission() already bypasses is_admin()
    // unconditionally server-side, so the client mirrors that here too.
    case 'Attendance':
      return user.role === 'admin' || has('attendance:view') || has('attendance:manage');
    // Admin can't carry a DB-seeded hr_*/leave:* permission either (same
    // protected-system-role reason as Attendance above) — mirror the bypass.
    case 'HR':
      return (
        user.role === 'admin'
        || has('leave:view') || has('leave:manage')
        || has('hr_documents:view') || has('hr_documents:manage')
        || has('hr_queries:view') || has('hr_queries:manage')
      );
    case 'Team':
      return has('team:view') || has('team:edit') || has('team:delete');
    case 'Settings':
      return has('settings:edit');
    case 'Audit Logs':
      return has('audit_logs:view');
    case 'Technician Portal':
      return user.role === 'admin' || user.role === 'technician';
    case 'Reception Portal':
      return user.role === 'admin' || user.role === 'receptionist';
    case 'Inventory Portal':
      return user.role === 'admin' || user.role === 'stock_manager' || user.role === 'inventory_manager';
    default:
      return LEGACY_MODULE_VISIBILITY[module]?.includes(user.role) ?? false;
  }
}
