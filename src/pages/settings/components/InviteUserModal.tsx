import { useState } from 'react';
import { createWirelessUser } from '@/services/wireless/users';

const ROLE_OPTIONS = [
  { value: 'technician', label: 'Technician' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'admin', label: 'Admin' },
];

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function InviteUserModal({ open, onClose, onCreated }: Props) {
  const [role, setRole] = useState('technician');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ name: string; email: string; password: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const reset = () => {
    setRole('technician');
    setName('');
    setEmail('');
    setError('');
    setResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return; }
    setSaving(true);
    const password = generatePassword();
    try {
      await createWirelessUser({ name: name.trim(), email: email.trim(), role, password });
      setResult({ name: name.trim(), email: email.trim(), password, role });
      onCreated?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `WIRELESS login\nEmail: ${result.email}\nPassword: ${result.password}\n\nSign in at your usual WIRELESS link, or use "Continue with Google" if this email is a Google account. You can change your password anytime from Settings.`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        {result ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-500 flex-shrink-0">
                <i className="ri-checkbox-circle-fill text-lg" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Account created</h3>
                <p className="text-xs text-muted-foreground">Share these credentials with {result.name}</p>
              </div>
            </div>

            <div className="space-y-2 bg-background border border-border rounded-xl p-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Email</span>
                <span className="text-foreground">{result.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Password</span>
                <span className="text-foreground">{result.password}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Role</span>
                <span className="text-foreground">{ROLE_OPTIONS.find(r => r.value === result.role)?.label ?? result.role}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              They can sign in with these credentials or use "Continue with Google" if this email is a Google account, and can change their password anytime from Settings.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={copyCredentials}
                className="flex-1 px-4 py-2 border border-border text-sm text-foreground rounded-lg hover:bg-background transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Credentials'}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-foreground mb-5">Invite Team Member</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Kwame Asante"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

              <p className="text-[11px] text-muted-foreground">
                A secure password is generated automatically — you'll get a copy to share with them once the account is created.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-border text-sm text-muted-foreground rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
