import { useState } from 'react';
import type { WirelessProfile } from '@/services/wireless/users';
import type { WirelessRole } from '@/services/wireless/roles';
import { errMessage } from '@/utils/errors';

interface TeamRolesSectionProps {
  roles: WirelessRole[];
  members: WirelessProfile[];
  loading: boolean;
  onInviteMember: () => void;
  onAddRole: () => void;
  onEditRole: (role: WirelessRole) => void;
  onDeleteRole: (role: WirelessRole) => void;
}

// Generic, permission-derived summary — works for any role, custom or
// system, without a separate hardcoded label map to keep in sync.
function permissionSummary(permissions: string[]): string[] {
  const resources = [...new Set(permissions.map(p => p.split(':')[0]))];
  return resources.map(r => r.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
}

export default function TeamRolesSection({ roles, members, loading, onInviteMember, onAddRole, onEditRole, onDeleteRole }: TeamRolesSectionProps) {
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  const memberCount = (roleId: string) => members.filter(m => m.role === roleId).length;

  const handleDelete = async (role: WirelessRole) => {
    if (!confirm(`Delete the "${role.name}" role? This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await onDeleteRole(role);
    } catch (e: unknown) {
      setDeleteError({ id: role.id, message: errMessage(e, 'Failed to delete role') });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Roles & Permissions</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">What each role can access. Create custom roles or edit what staff can do</p>
          </div>
          <button
            onClick={onAddRole}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <i className="ri-add-line" /> Add Role
          </button>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {roles.map((role) => (
            <div key={role.id} className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}14` }}>
                <i className="ri-shield-user-line text-sm" style={{ color: role.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{role.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {loading ? '…' : `${memberCount(role.id)} member${memberCount(role.id) !== 1 ? 's' : ''}`}
                  </span>
                  {role.is_system && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">System</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {permissionSummary(role.permissions).length === 0 ? (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">No permissions granted</span>
                  ) : permissionSummary(role.permissions).map((label) => (
                    <span key={label} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${role.color}14`, color: role.color }}>{label}</span>
                  ))}
                </div>
                {deleteError?.id === role.id && (
                  <p className="text-[11px] text-red-400 mt-2">{deleteError.message}</p>
                )}
              </div>
              {!role.is_system && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditRole(role)}
                    className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                    title="Edit role"
                  >
                    <i className="ri-edit-line" />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete role"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Team Members</h3>
        {loading ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">Loading…</p>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <i className="ri-group-line text-2xl text-[hsl(var(--muted-foreground))] mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No team members yet. Invite your team to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {members.map((m) => {
              const role = roles.find(r => r.id === m.role);
              return (
                <div key={m.id} className="py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${role?.color ?? '#64748b'}14`, color: role?.color ?? '#64748b' }}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">{m.name}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {role?.name ?? m.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={onInviteMember} className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
          <i className="ri-user-add-line mr-1" /> Invite Team Member
        </button>
      </div>
    </div>
  );
}
