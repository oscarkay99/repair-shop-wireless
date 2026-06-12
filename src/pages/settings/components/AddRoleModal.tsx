interface RoleData {
  id: string;
  name: string;
  permissions: string[];
}

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  editRole?: RoleData | null;
}

export default function AddRoleModal({ open, onClose, editRole }: AddRoleModalProps) {
  if (!open) return null;

  const isEditing = !!editRole;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Role' : 'Create New Role'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Role Name</label>
            <input type="text" defaultValue={editRole?.name ?? ''} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200" placeholder="e.g. Store Manager" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {['Dashboard', 'Sales', 'Inventory', 'Customers', 'Repairs', 'Payments', 'Analytics', 'Settings', 'Team', 'Reports'].map((perm) => (
                <label key={perm} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" defaultChecked={editRole?.permissions.includes(perm)} className="rounded" />
                  <span className="text-xs text-slate-700">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap bg-[#DC1F1F] hover:bg-[#B81616] transition-colors duration-150">
            {isEditing ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
