interface TeamRole {
  id: string;
  name: string;
  members: number;
  permissions: string[];
}

interface TeamRolesSectionProps {
  roles: TeamRole[];
  onAddRole: () => void;
  onEditRole: (role: TeamRole) => void;
  onInviteMember: () => void;
}

export default function TeamRolesSection({ roles, onAddRole, onEditRole, onInviteMember }: TeamRolesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Roles & Permissions</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Control what each role can access</p>
          </div>
          <button onClick={onAddRole} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap bg-[#EC0118] hover:bg-[#BD0113] transition-colors duration-150">
            <i className="ri-add-line mr-1" /> Add Role
          </button>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {roles.map((role) => (
            <div key={role.id} className="p-4 flex items-start gap-4 hover:bg-[hsl(var(--muted))]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,1,24,0.08)' }}>
                <i className="ri-shield-user-line text-sm" style={{ color: '#EC0118' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{role.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">{role.members} member{role.members !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(236,1,24,0.08)] text-[#EC0118]">{perm}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => onEditRole(role)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer flex-shrink-0">
                <i className="ri-edit-line text-[hsl(var(--muted-foreground))] text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Team Members</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <i className="ri-group-line text-2xl text-[hsl(var(--muted-foreground))] mb-2" />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">No team members yet — invite your team to get started.</p>
        </div>
        <button onClick={onInviteMember} className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer whitespace-nowrap">
          <i className="ri-user-add-line mr-1" /> Invite Team Member
        </button>
      </div>
    </div>
  );
}
