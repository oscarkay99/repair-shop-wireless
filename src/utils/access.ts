import { rolePermissions } from '@/mocks/users';
import type { UserRole } from '@/hooks/useAuth';

export type AppModule =
  | 'Dashboard'
  | 'Analytics'
  | 'AI Studio'
  | 'Audit Logs'
  | 'Inventory'
  | 'Payments'
  | 'Customers'
  | 'Tickets'
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

export function canAccessModule(role: UserRole | null | undefined, module: AppModule) {
  if (!role) return false;
  return rolePermissions[role].includes(module);
}
