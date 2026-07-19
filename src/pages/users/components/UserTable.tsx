import { roleLabels, roleColors } from '@/mocks/users';
import type { SystemUser } from '@/mocks/users';
import type { UserRole } from '@/hooks/useAuth';

const statusConfig = {
  active: { label: 'Active', color: '#25D366', bg: '#25D36615' },
  inactive: { label: 'Inactive', color: '#94A3B8', bg: '#94A3B815' },
  suspended: { label: 'Suspended', color: '#E05A2B', bg: '#E05A2B15' },
};

interface UserTableProps {
  filtered: SystemUser[];
  selectedUser: string | null;
  onSelect: (id: string) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  filterRole: string;
  onFilterRole: (v: string) => void;
  onAddUser: () => void;
}

export default function UserTable({
  filtered,
  selectedUser,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  search,
  onSearch,
  filterRole,
  onFilterRole,
  onAddUser,
}: UserTableProps) {
  return (
    <div className="lg:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-3 py-2.5 flex-1">
          <i className="ri-search-line text-[hsl(var(--muted-foreground))] text-sm" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent text-sm text-[hsl(var(--muted-foreground))] outline-none w-full"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => onFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] focus:outline-none"
        >
          <option value="all">All Roles</option>
          {(Object.keys(roleLabels) as UserRole[]).map(r => (
            <option key={r} value={r}>{roleLabels[r]}</option>
          ))}
        </select>
        <button
          onClick={onAddUser}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2"
          style={{ background: '#DC1F1F' }}
        >
          <i className="ri-user-add-line" /> Add User
        </button>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="divide-y divide-[hsl(var(--border))]">
          {filtered.map(user => {
            const st = statusConfig[user.status];
            const rc = roleColors[user.role];
            return (
              <div
                key={user.id}
                onClick={() => onSelect(user.id)}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-[hsl(var(--muted))]/50 ${selectedUser === user.id ? 'bg-[rgba(220,31,31,0.04)]' : ''}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: rc }}>
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{user.name}</p>
                    {user.role === 'admin' && (
                      <i className="ri-shield-star-line text-xs" style={{ color: '#DC1F1F' }} />
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold text-white flex-shrink-0" style={{ background: rc }}>
                  {roleLabels[user.role]}
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] flex-shrink-0 hidden lg:block w-32 text-right">{user.lastLogin}</p>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit(user)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer"
                  >
                    <i className="ri-edit-line text-[hsl(var(--muted-foreground))] text-sm" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(user.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer"
                    title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <i className={`${user.status === 'active' ? 'ri-pause-circle-line text-amber-400' : 'ri-play-circle-line text-green-500'} text-sm`} />
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onDelete(user.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 cursor-pointer group"
                    >
                      <i className="ri-delete-bin-line text-red-400 group-hover:text-red-500 text-sm transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
