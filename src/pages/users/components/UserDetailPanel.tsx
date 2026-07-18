import { roleLabels, roleColors } from '@/mocks/users';
import type { SystemUser } from '@/mocks/users';

const allPermissions = ['Dashboard', 'Analytics', 'Audit Logs', 'POS', 'Inventory', 'Leads', 'Sales', 'Payments', 'Customers', 'Tickets', 'Warranty', 'WhatsApp', 'Instagram', 'TikTok', 'Marketing', 'Price Intel', 'Trade-In', 'Delivery', 'Wallet', 'Expenses', 'Suppliers', 'Reports', 'Loyalty', 'Calendar', 'Team', 'Settings', 'Authentication', 'AI Studio'];

const statusConfig = {
  active: { label: 'Active', color: '#25D366', bg: '#25D36615' },
  inactive: { label: 'Inactive', color: '#94A3B8', bg: '#94A3B815' },
  suspended: { label: 'Suspended', color: '#E05A2B', bg: '#E05A2B15' },
};

interface UserDetailPanelProps {
  user: SystemUser | undefined;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (id: string) => void;
}

export default function UserDetailPanel({ user, onEdit, onToggleStatus }: UserDetailPanelProps) {
  if (!user) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-8 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(220,31,31,0.08)' }}>
          <i className="ri-user-line text-xl" style={{ color: '#DC1F1F' }} />
        </div>
        <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">Select a user</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Click any user to view their profile and permissions</p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold" style={{ background: roleColors[user.role] }}>
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[hsl(var(--foreground))]">{user.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white mt-1 inline-block" style={{ background: roleColors[user.role] }}>
            {roleLabels[user.role]}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-5 text-xs">
        {[
          { label: 'Phone', value: user.phone },
          { label: 'Status', value: statusConfig[user.status].label },
          { label: 'Member Since', value: user.createdAt },
          { label: 'Last Login', value: user.lastLogin },
        ].map(item => (
          <div key={item.label} className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
            <span className="text-[hsl(var(--muted-foreground))]">{item.label}</span>
            <span className="font-semibold text-[hsl(var(--foreground))]">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold text-[hsl(var(--foreground))] mb-2">Module Access ({user.permissions.length}/{allPermissions.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {allPermissions.map(perm => (
            <span
              key={perm}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.permissions.includes(perm) ? 'text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
              style={user.permissions.includes(perm) ? { background: roleColors[user.role] } : {}}
            >
              {perm}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(user)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#DC1F1F' }}>
          <i className="ri-edit-line mr-1" /> Edit User
        </button>
        <button onClick={() => onToggleStatus(user.id)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-pointer whitespace-nowrap">
          {user.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}
