import { useState, useEffect } from 'react';
import { getWirelessUsers, createWirelessUser, deleteWirelessUser, type WirelessProfile } from '@/services/wireless/users';
import { isSupabaseConfigured } from '@/services/supabase';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  technician: 'Technician',
  inventory_manager: 'Inventory Manager',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  sales_manager: 'bg-blue-500/20 text-blue-400',
  technician: 'bg-amber-500/20 text-amber-400',
  inventory_manager: 'bg-purple-500/20 text-purple-400',
};

interface AddUserForm {
  name: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: AddUserForm = { name: '', email: '', role: 'technician', password: '', confirmPassword: '' };

export default function UsersSection() {
  const [users, setUsers] = useState<WirelessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getWirelessUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await createWirelessUser({ name: form.name, email: form.email, role: form.role, password: form.password });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

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
            onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
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
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <p className="text-xs text-muted-foreground w-24 text-right hidden sm:block">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </p>
                <button
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
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

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-5">Add New User</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kwame Asante"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="name@wireless.com"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Temporary Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat password"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAdd(false); setError(''); }}
                  className="flex-1 px-4 py-2 border border-border text-sm text-muted-foreground rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
