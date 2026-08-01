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
  | 'Portal'
  | 'Warranty'
  | 'Delivery'
  | 'Expenses'
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
  // Reception needs to see who's available before assigning a ticket —
  // matches technicians:edit already being granted to receptionist at the
  // RLS layer (this was previously the one module where frontend gating was
  // stricter than the backend actually allowed).
  Technicians: ['admin', 'receptionist'],
};

type PermCtx = Pick<AuthUser, 'role' | 'permissions' | 'scopeTicketsToTechnician' | 'dashboardVariant'> | null | undefined;

export function canAccessModule(user: PermCtx, module: AppModule): boolean {
  if (!user?.role) return false;
  const perms = new Set(user.permissions ?? []);
  const has = (p: string) => perms.has(p);

  switch (module) {
    case 'Dashboard':
      return true;
    case 'Tickets':
    case 'Repairs':
      return !!user.scopeTicketsToTechnician || has('tickets:view') || has('tickets:create') || has('tickets:edit') || has('tickets:delete');
    case 'Customers':
      return has('customers:create') || has('customers:edit') || has('customers:delete');
    case 'Inventory':
      return has('parts:edit');
    case 'Payments':
      return has('payments:create');
    case 'Invoices':
      return has('invoices:create') || has('invoices:edit') || has('invoices:delete') || has('invoices:items_edit');
    case 'Sales':
      return has('sales:create');
    case 'Expenses':
      return has('expenses:view') || has('expenses:edit');
    case 'Team':
      return has('team:view') || has('team:edit') || has('team:delete');
    case 'Settings':
      return has('settings:edit');
    case 'Audit Logs':
      return has('audit_logs:view');
    // Gated on dashboardVariant (which route/portal the role lands on),
    // not a hardcoded role-id list — otherwise no custom role could ever
    // reach the portal it was actually built and routed for.
    case 'Portal':
      return user.role === 'admin' || user.dashboardVariant === 'receptionist' || user.dashboardVariant === 'inventory_portal' || user.role === 'stock_manager';
    default:
      return LEGACY_MODULE_VISIBILITY[module]?.includes(user.role) ?? false;
  }
}
