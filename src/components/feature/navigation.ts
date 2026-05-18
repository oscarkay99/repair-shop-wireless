import type { AppModule } from '@/utils/access';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  module?: AppModule;
  group?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', icon: 'ri-dashboard-3-line', path: '/', module: 'Dashboard' },
      { label: 'Analytics', icon: 'ri-bar-chart-2-line', path: '/analytics', module: 'Analytics' },
      { label: 'AI Studio', icon: 'ri-sparkling-2-line', path: '/ai-studio', module: 'AI Studio' },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { label: 'Repairs', icon: 'ri-tools-line', path: '/repairs', module: 'Repairs' },
      { label: 'Customers', icon: 'ri-group-line', path: '/customers', module: 'Customers' },
      { label: 'Warranty', icon: 'ri-shield-check-line', path: '/warranty', module: 'Warranty' },
      { label: 'Parts', icon: 'ri-archive-line', path: '/inventory', module: 'Inventory' },
      { label: 'Payments', icon: 'ri-bank-card-line', path: '/payments', module: 'Payments' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Delivery', icon: 'ri-truck-line', path: '/delivery', module: 'Delivery' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', icon: 'ri-calculator-line', path: '/expenses', module: 'Expenses' },
      { label: 'Reports', icon: 'ri-file-chart-line', path: '/reports', module: 'Reports' },
    ],
  },
  {
    label: 'Loyalty',
    items: [
      { label: 'Loyalty', icon: 'ri-vip-crown-line', path: '/loyalty', module: 'Loyalty' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Authentication', icon: 'ri-shield-check-line', path: '/authentication', module: 'Authentication' },
      { label: 'Team', icon: 'ri-team-line', path: '/team', module: 'Team' },
      { label: 'Users', icon: 'ri-user-settings-line', path: '/users', module: 'Users' },
      { label: 'Audit Logs', icon: 'ri-file-list-3-line', path: '/audit-logs', module: 'Audit Logs' },
      { label: 'Settings', icon: 'ri-settings-4-line', path: '/settings', module: 'Settings' },
    ],
  },
];

export const publicItems: NavItem[] = [];
