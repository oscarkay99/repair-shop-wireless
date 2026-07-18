import { roleLabels, roleColors } from '@/mocks/users';
import type { SystemUser } from '@/mocks/users';
import type { UserRole } from '@/hooks/useAuth';

const allPermissions = ['Dashboard', 'Analytics', 'Audit Logs', 'POS', 'Inventory', 'Leads', 'Sales', 'Payments', 'Customers', 'Tickets', 'Warranty', 'WhatsApp', 'Instagram', 'TikTok', 'Marketing', 'Price Intel', 'Trade-In', 'Delivery', 'Wallet', 'Expenses', 'Suppliers', 'Reports', 'Loyalty', 'Calendar', 'Team', 'Settings', 'Authentication', 'AI Studio'];

interface UserFormModalProps {
  open: boolean;
  isEditing: boolean;
  editingUser: Partial<SystemUser> | null;
  password: string;
  onPasswordChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveError?: string | null;
  onRoleChange: (role: UserRole) => void;
  onTogglePermission: (perm: string) => void;
  onFieldChange: (field: keyof SystemUser, value: string) => void;
}

export default function UserFormModal({
  open,
  isEditing,
  editingUser,
  password,
  onPasswordChange,
  onClose,
  onSave,
  saving,
  saveError,
  onRoleChange,
  onTogglePermission,
  onFieldChange,
}: UserFormModalProps) {
  if (!open || !editingUser) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between sticky top-0 bg-[hsl(var(--card))] rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{isEditing ? 'Edit User' : 'Add New User'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
            <i className="ri-close-line text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Full Name *</label>
              <input
                type="text"
                value={editingUser.name || ''}
                onChange={(e) => onFieldChange('name', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Phone</label>
              <input
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
                placeholder="+233 24 000 0000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Email Address *</label>
            <input
              type="email"
              value={editingUser.email || ''}
              onChange={(e) => onFieldChange('email', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
              placeholder="user@fixhub.com"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-1.5">Temporary Password *</label>
              <input
                type="text"
                value={password}
                onChange={e => onPasswordChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
                placeholder="Set a temporary password"
              />
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">Share this with the user so they can sign in</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(roleLabels) as UserRole[]).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(role)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${editingUser.role === role ? 'border-transparent text-white' : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                  style={editingUser.role === role ? { background: roleColors[role], borderColor: roleColors[role] } : {}}
                >
                  <i className="ri-shield-user-line text-sm" />
                  <span className="text-xs font-semibold">{roleLabels[role]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Module Permissions</label>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{(editingUser.permissions || []).length}/{allPermissions.length} selected</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-3 bg-[hsl(var(--muted))] rounded-xl max-h-48 overflow-y-auto">
              {allPermissions.map(perm => {
                const checked = (editingUser.permissions || []).includes(perm);
                return (
                  <label key={perm} className="flex items-center gap-1.5 cursor-pointer p-1 rounded-lg hover:bg-[hsl(var(--card))] transition-colors">
                    <div
                      onClick={() => onTogglePermission(perm)}
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border transition-all ${checked ? 'border-transparent' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}
                      style={checked ? { background: roleColors[editingUser.role as UserRole] || '#DC1F1F' } : {}}
                    >
                      {checked && <i className="ri-check-line text-white text-[10px]" />}
                    </div>
                    <span className="text-[10px] text-[hsl(var(--foreground))]">{perm}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] block mb-2">Status</label>
            <div className="flex gap-2">
              {(['active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFieldChange('status', s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${editingUser.status === s ? 'text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]'}`}
                  style={editingUser.status === s ? { background: s === 'active' ? '#25D366' : '#94A3B8' } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-rose-500 text-center">{saveError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-pointer whitespace-nowrap disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#DC1F1F' }}
            >
              {saving && <i className="ri-loader-4-line animate-spin text-xs" />}
              {isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
