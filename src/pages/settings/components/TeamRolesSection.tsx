import type { WirelessProfile } from '@/services/wireless/users';

interface TeamRole {
  id: string;
  name: string;
  members: number;
  permissions: string[];
}

interface TeamRolesSectionProps {
  roles: TeamRole[];
  members: WirelessProfile[];
  loading: boolean;
  onInviteMember: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  technician: 'Technician',
  receptionist: 'Receptionist',
};

export default function TeamRolesSection({ roles, members, loading, onInviteMember }: TeamRolesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-5 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Roles & Permissions</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">What each role can access — roles are fixed; assign them to staff from the Users tab</p>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {roles.map((role) => (
            <div key={role.id} className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)' }}>
                <i className="ri-shield-user-line text-sm" style={{ color: '#EC0118' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{role.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {loading ? '…' : `${role.members} member${role.members !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(236,1,24,0.08)] text-[#EC0118]">{perm}</span>
                  ))}
                </div>
              </div>
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
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No team members yet — invite your team to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)', color: '#EC0118' }}>
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">{m.name}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{m.email}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onInviteMember} className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
          <i className="ri-user-add-line mr-1" /> Invite Team Member
        </button>
      </div>
    </div>
  );
}
