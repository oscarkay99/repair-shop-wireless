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
}

export default function TeamRolesSection({ roles, onAddRole, onEditRole }: TeamRolesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Roles & Permissions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control what each role can access</p>
          </div>
          <button onClick={onAddRole} className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap bg-[#DC1F1F] hover:bg-[#B81616] transition-colors duration-150">
            <i className="ri-add-line mr-1" /> Add Role
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {roles.map((role) => (
            <div key={role.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220,31,31,0.08)' }}>
                <i className="ri-shield-user-line text-sm" style={{ color: '#DC1F1F' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{role.members} member{role.members !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(220,31,31,0.08)] text-[#DC1F1F]">{perm}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => onEditRole(role)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer flex-shrink-0">
                <i className="ri-edit-line text-slate-400 text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Team Members</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <i className="ri-group-line text-2xl text-slate-200 mb-2" />
          <p className="text-xs text-slate-400">No team members yet — invite your team to get started.</p>
        </div>
        <button onClick={onAddRole} className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
          <i className="ri-user-add-line mr-1" /> Invite Team Member
        </button>
      </div>
    </div>
  );
}
