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
}

export const rolePermissions: Record<UserRole, string[]> = {
  admin:             ['Dashboard', 'Analytics', 'Audit Logs', 'Inventory', 'Payments', 'Customers', 'Repairs', 'Tickets', 'Technicians', 'Invoices', 'Sales', 'Activity', 'Portal', 'Warranty', 'Delivery', 'Expenses', 'Reports', 'Loyalty', 'Team', 'Settings', 'Authentication', 'AI Studio', 'Users'],
  sales_manager:     ['Dashboard', 'Analytics', 'Audit Logs', 'Inventory', 'Payments', 'Customers', 'Repairs', 'Tickets', 'Invoices', 'Sales', 'Activity', 'Reports', 'Loyalty', 'Team'],
  sales_rep:         ['Dashboard', 'Audit Logs', 'Repairs', 'Tickets', 'Customers', 'Inventory', 'Activity'],
  technician:        ['Dashboard', 'Audit Logs', 'Repairs', 'Tickets', 'Warranty', 'Inventory', 'Customers', 'Activity'],
  inventory_manager: ['Dashboard', 'Analytics', 'Audit Logs', 'Inventory', 'Delivery', 'Reports', 'Activity'],
};

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  technician: 'Technician',
  inventory_manager: 'Inventory Manager',
};

export const roleColors: Record<UserRole, string> = {
  admin:             '#DC1F1F',
  sales_manager:     '#F59E0B',
  sales_rep:         '#10B981',
  technician:        '#06B6D4',
  inventory_manager: '#64748b',
};

export const systemUsers: SystemUser[] = [
  {
    id: 'U001',
    name: 'Kwame Asante',
    email: 'admin@fixhub.com',
    role: 'admin',
    avatar: 'KA',
    status: 'active',
    lastLogin: 'Apr 23, 2026 · 9:42 AM',
    createdAt: 'Jan 1, 2026',
    phone: '+233 24 000 0001',
    permissions: rolePermissions.admin,
  },
  {
    id: 'U002',
    name: 'Kofi Mensah',
    email: 'kofi@fixhub.com',
    role: 'sales_manager',
    avatar: 'KM',
    status: 'active',
    lastLogin: 'Apr 23, 2026 · 8:15 AM',
    createdAt: 'Jan 5, 2026',
    phone: '+233 24 000 0002',
    permissions: rolePermissions.sales_manager,
  },
  {
    id: 'U003',
    name: 'Abena Frimpong',
    email: 'abena@fixhub.com',
    role: 'sales_rep',
    avatar: 'AF',
    status: 'active',
    lastLogin: 'Apr 22, 2026 · 5:30 PM',
    createdAt: 'Feb 1, 2026',
    phone: '+233 24 000 0003',
    permissions: rolePermissions.sales_rep,
  },
  {
    id: 'U004',
    name: 'Ama Owusu',
    email: 'ama@fixhub.com',
    role: 'technician',
    avatar: 'AO',
    status: 'active',
    lastLogin: 'Apr 22, 2026 · 4:00 PM',
    createdAt: 'Feb 10, 2026',
    phone: '+233 24 000 0004',
    permissions: rolePermissions.technician,
  },
  {
    id: 'U005',
    name: 'Yaw Darko',
    email: 'yaw@fixhub.com',
    role: 'inventory_manager',
    avatar: 'YD',
    status: 'active',
    lastLogin: 'Apr 21, 2026 · 6:00 PM',
    createdAt: 'Mar 1, 2026',
    phone: '+233 24 000 0005',
    permissions: rolePermissions.inventory_manager,
  },
  {
    id: 'U006',
    name: 'Efua Boateng',
    email: 'efua@fixhub.com',
    role: 'sales_rep',
    avatar: 'EB',
    status: 'inactive',
    lastLogin: 'Apr 10, 2026 · 2:00 PM',
    createdAt: 'Mar 15, 2026',
    phone: '+233 24 000 0006',
    permissions: rolePermissions.sales_rep,
  },
];
