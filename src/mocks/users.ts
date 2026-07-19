import type { UserRole } from '@/hooks/useAuth';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  phone: string;
  permissions: string[];
  /** Recurring birthday, month-day only (no birth year tracked) — format 'MM-DD'. */
  birthday?: string;
}

export const rolePermissions: Record<UserRole, string[]> = {
  admin:             ['Dashboard', 'Analytics', 'Audit Logs', 'Inventory', 'Payments', 'Customers', 'Tickets', 'Technicians', 'Invoices', 'Sales', 'Activity', 'Portal', 'Warranty', 'Delivery', 'Expenses', 'Reports', 'Loyalty', 'Team', 'Settings', 'Authentication', 'AI Studio', 'Users'],
  sales_manager:     ['Dashboard', 'Analytics', 'Inventory', 'Payments', 'Customers', 'Tickets', 'Invoices', 'Sales', 'Reports', 'Loyalty', 'Team'],
  technician:        ['Dashboard', 'Tickets', 'Warranty', 'Inventory', 'Customers'],
  inventory_manager: ['Dashboard', 'Analytics', 'Inventory', 'Delivery', 'Reports'],
  receptionist:      ['Dashboard', 'Tickets', 'Customers', 'Payments', 'Invoices'],
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  technician: 'Technician',
  inventory_manager: 'Inventory Manager',
  receptionist: 'Receptionist',
};

export const roleColors: Record<UserRole, string> = {
  admin:             '#EC0118',
  sales_manager:     '#F59E0B',
  technician:        '#06B6D4',
  inventory_manager: '#64748b',
  receptionist:      '#8B5CF6',
};

export const systemUsers: SystemUser[] = [
  {
    id: 'U001',
    name: 'Kwame Asante',
    email: 'admin@wireless.com',
    role: 'admin',
    avatar: 'KA',
    status: 'active',
    lastLogin: 'Apr 23, 2026 · 9:42 AM',
    createdAt: 'Jan 1, 2026',
    phone: '+233 24 000 0001',
    permissions: rolePermissions.admin,
    birthday: '03-12',
  },
  {
    id: 'U002',
    name: 'Kofi Mensah',
    email: 'kofi@wireless.com',
    role: 'sales_manager',
    avatar: 'KM',
    status: 'active',
    lastLogin: 'Apr 23, 2026 · 8:15 AM',
    createdAt: 'Jan 5, 2026',
    phone: '+233 24 000 0002',
    permissions: rolePermissions.sales_manager,
    birthday: '07-18',
  },
  {
    id: 'U004',
    name: 'Ama Owusu',
    email: 'ama@wireless.com',
    role: 'technician',
    avatar: 'AO',
    status: 'active',
    lastLogin: 'Apr 22, 2026 · 4:00 PM',
    createdAt: 'Feb 10, 2026',
    phone: '+233 24 000 0004',
    permissions: rolePermissions.technician,
    birthday: '07-25',
  },
  {
    id: 'U005',
    name: 'Yaw Darko',
    email: 'yaw@wireless.com',
    role: 'inventory_manager',
    avatar: 'YD',
    status: 'active',
    lastLogin: 'Apr 21, 2026 · 6:00 PM',
    createdAt: 'Mar 1, 2026',
    phone: '+233 24 000 0005',
    permissions: rolePermissions.inventory_manager,
    birthday: '11-02',
  },
  {
    id: 'U006',
    name: 'Efua Boateng',
    email: 'efua@wireless.com',
    role: 'receptionist',
    avatar: 'EB',
    status: 'active',
    lastLogin: 'Jun 14, 2026 · 8:00 AM',
    createdAt: 'Mar 15, 2026',
    phone: '+233 24 000 0006',
    permissions: rolePermissions.receptionist,
    birthday: '09-30',
  },
];
