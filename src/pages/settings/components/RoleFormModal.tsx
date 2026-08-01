import { useState } from 'react';
import type { WirelessRole, RoleInput } from '@/services/wireless/roles';
import { errMessage } from '@/utils/errors';

const PERMISSION_GROUPS: { resource: string; label: string; actions: { value: string; label: string }[] }[] = [
  { resource: 'tickets', label: 'Tickets', actions: [
    { value: 'tickets:view', label: 'View' }, { value: 'tickets:create', label: 'Create' },
    { value: 'tickets:edit', label: 'Edit' }, { value: 'tickets:delete', label: 'Delete' },
  ] },
  { resource: 'ticket_media', label: 'Ticket Photos/Videos', actions: [
    { value: 'ticket_media:view', label: 'View' }, { value: 'ticket_media:create', label: 'Upload' }, { value: 'ticket_media:delete', label: 'Delete' },
  ] },
  { resource: 'ticket_comments', label: 'Ticket Comments', actions: [
    { value: 'ticket_comments:view', label: 'View' }, { value: 'ticket_comments:delete', label: 'Delete' },
  ] },
  { resource: 'ticket_parts', label: 'Parts Used on Tickets', actions: [
    { value: 'ticket_parts:view', label: 'View' }, { value: 'ticket_parts:create', label: 'Add / Remove' },
  ] },
  { resource: 'customers', label: 'Customers', actions: [
    { value: 'customers:create', label: 'Create' }, { value: 'customers:edit', label: 'Edit' }, { value: 'customers:delete', label: 'Delete' },
  ] },
  { resource: 'invoices', label: 'Invoices', actions: [
    { value: 'invoices:create', label: 'Create' }, { value: 'invoices:edit', label: 'Edit' },
    { value: 'invoices:delete', label: 'Delete' }, { value: 'invoices:items_edit', label: 'Edit Line Items' },
  ] },
  { resource: 'technicians', label: 'Technicians Roster', actions: [{ value: 'technicians:edit', label: 'Manage' }] },
  { resource: 'parts', label: 'Inventory / Parts', actions: [
    { value: 'parts:edit', label: 'Manage' }, { value: 'parts:create', label: 'Add New Parts' },
  ] },
  { resource: 'sales', label: 'Accessory Sales (POS)', actions: [{ value: 'sales:create', label: 'Record Sale' }] },
  { resource: 'payments', label: 'Payments', actions: [{ value: 'payments:create', label: 'Record Payment' }] },
  { resource: 'expenses', label: 'Expenses', actions: [
    { value: 'expenses:view', label: 'View' }, { value: 'expenses:edit', label: 'Manage' },
  ] },
  { resource: 'settings', label: 'Settings', actions: [{ value: 'settings:edit', label: 'Manage' }] },
  { resource: 'team', label: 'Team & Staff', actions: [
    { value: 'team:view', label: 'View' }, { value: 'team:edit', label: 'Edit' }, { value: 'team:delete', label: 'Remove' },
  ] },
  { resource: 'audit_logs', label: 'Audit Logs', actions: [{ value: 'audit_logs:view', label: 'View All' }] },
];

const DASHBOARD_VARIANTS = [
  { value: 'admin', label: 'Admin (full overview)' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'inventory_portal', label: 'Inventory Manager (stock portal)' },
];

const COLOR_SWATCHES = ['#EC0118', '#F59E0B', '#06B6D4', '#8B5CF6', '#22C55E', '#3B82F6', '#EC4899', '#64748B'];

interface Props {
  role: WirelessRole | null;
  onClose: () => void;
  onSave: (id: string, input: RoleInput) => Promise<void>;
}

export default function RoleFormModal({ role, onClose, onSave }: Props) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name ?? '');
  const [color, setColor] = useState(role?.color ?? COLOR_SWATCHES[0]);
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const [scopeTickets, setScopeTickets] = useState(role?.scope_tickets_to_technician ?? false);
  const [dashboardVariant, setDashboardVariant] = useState(role?.dashboard_variant ?? 'admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePerm = (perm: string) => {
    setPermissions(prev => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    const id = role?.id ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!id) { setError('Name must contain at least one letter or number'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(id, {
        id,
        name: name.trim(),
        color,
        permissions: [...permissions],
        scope_tickets_to_technician: scopeTickets,
        dashboard_variant: dashboardVariant,
      });
      onClose();
    } catch (e: unknown) {
      setError(errMessage(e, 'Failed to save role'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 pb-4 flex-shrink-0">
          <h3 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Role' : 'Add Role'}</h3>
        </div>

        <div className="px-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Role Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Junior Technician"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-2">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px hsl(var(--card)), 0 0 0 4px ${c}` : 'none' }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dashboard Layout</label>
            <select
              value={dashboardVariant}
              onChange={e => setDashboardVariant(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {DASHBOARD_VARIANTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2.5 py-1 cursor-pointer">
            <input type="checkbox" checked={scopeTickets} onChange={e => setScopeTickets(e.target.checked)} className="w-4 h-4" />
            <span className="text-xs text-foreground">Only see tickets assigned to them (technician-style scoping)</span>
          </label>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Permissions</p>
            <div className="space-y-3">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.resource} className="border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {group.actions.map(a => (
                      <label key={a.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.has(a.value)}
                          onChange={() => togglePerm(a.value)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs text-muted-foreground">{a.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="p-6 pt-4 flex gap-3 flex-shrink-0 border-t border-border">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border text-sm text-muted-foreground rounded-lg hover:bg-background transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
