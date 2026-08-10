import type { UserRole } from '@/hooks/useAuth';

export const rolePermissions: Record<UserRole, string[]> = {
  admin:             ['Dashboard', 'Analytics', 'Audit Logs', 'Inventory', 'Payments', 'Customers', 'Tickets', 'Technicians', 'Invoices', 'Sales', 'Activity', 'Portal', 'Warranty', 'Delivery', 'Expenses', 'Reports', 'Loyalty', 'Team', 'Settings', 'Authentication', 'AI Studio', 'Users'],
  sales_manager:     ['Dashboard', 'Analytics', 'Inventory', 'Delivery', 'Payments', 'Customers', 'Invoices', 'Sales', 'Reports', 'Loyalty', 'Team'],
  technician:        ['Dashboard', 'Tickets', 'Warranty'],
  receptionist:      ['Dashboard', 'Customers', 'Payments', 'Invoices', 'Tickets'],
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  technician: 'Technician',
  receptionist: 'Receptionist',
};

export const roleColors: Record<UserRole, string> = {
  admin:             '#EC0118',
  sales_manager:     '#F59E0B',
  technician:        '#06B6D4',
  receptionist:      '#8B5CF6',
};
