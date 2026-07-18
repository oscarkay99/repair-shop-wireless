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
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{isEditing ? 'Edit Role' : 'Create New Role'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
            <i className="ri-close-line text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Role Name</label>
            <input type="text" defaultValue={editRole?.name ?? ''} className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]" placeholder="e.g. Store Manager" />
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {['Dashboard', 'Sales', 'Inventory', 'Customers', 'Tickets', 'Payments', 'Analytics', 'Settings', 'Team', 'Reports'].map((perm) => (
                <label key={perm} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--muted))] cursor-pointer">
                  <input type="checkbox" defaultChecked={editRole?.permissions.includes(perm)} className="rounded" />
                  <span className="text-xs text-[hsl(var(--foreground))]">{perm}</span>
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
