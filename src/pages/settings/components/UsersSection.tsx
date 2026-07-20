import { useState, useEffect } from 'react';
import { getWirelessUsers, updateWirelessUser, deleteWirelessUser, type WirelessProfile } from '@/services/wireless/users';
import { isSupabaseConfigured } from '@/services/supabase';
import InviteUserModal from './InviteUserModal';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  technician: 'Technician',
  inventory_manager: 'Inventory Manager',
  receptionist: 'Receptionist',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  sales_manager: 'bg-blue-500/20 text-blue-400',
  technician: 'bg-amber-500/20 text-amber-400',
  inventory_manager: 'bg-purple-500/20 text-purple-400',
  receptionist: 'bg-cyan-500/20 text-cyan-400',
};

function EditUserModal({ user, onClose, onSaved }: { user: WirelessProfile; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [username, setUsername] = useState(user.username ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await updateWirelessUser(user.id, { name: name.trim(), role, username: username.trim() || null });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-5">Edit User</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <p className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Username <span className="opacity-60">(optional)</span></label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="e.g. kwame.a"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border text-sm text-muted-foreground rounded-lg hover:bg-background transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersSection() {
  const [users, setUsers] = useState<WirelessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<WirelessProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getWirelessUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (user: WirelessProfile) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      await deleteWirelessUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">User management requires a live Supabase connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">Staff Users</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage who can access the Wireless system</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No users found</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-3 rounded-xl bg-background/50 hover:bg-background transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {u.avatar || u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}{u.username ? ` · @${u.username}` : ''}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <p className="text-xs text-muted-foreground w-24 text-right hidden sm:block">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </p>
                <button
                  onClick={() => setEditingUser(u)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit user"
                >
                  <i className="ri-edit-line" />
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Delete user"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <InviteUserModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={load} />
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={load} />
      )}
    </div>
  );
}
