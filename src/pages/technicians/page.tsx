import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useRepairs } from '@/hooks/useRepairs';
import Pagination from '@/components/shared/Pagination';
import { Clock, Trash2, UserPlus, X, RefreshCw, Pencil, Eye, EyeOff, KeyRound } from 'lucide-react';
import type { Technician } from '@/types/wireless';
import { REPAIR_STATUS_META, isActiveRepairStatus } from '@/utils/repairStatus';
import { createWirelessUser } from '@/services/wireless/users';
import { isCurrentlyUnavailable } from '@/utils/technicianAvailability';
import { errMessage } from '@/utils/errors';
import { avatarColor, initials, TIMELINE_FILTERS, filterHours, type TimelineFilter } from './shared';
import PerformanceTab from './tabs/PerformanceTab';
import AttendanceTab from './tabs/AttendanceTab';

const PAGE_SIZE = 9;

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function timeOnJob(receivedAt: string): string {
  const ms = Date.now() - new Date(receivedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ── Add Technician Modal ──────────────────────────────────────────────────────

function AddTechnicianModal({ onSave, onClose }: {
  onSave: (t: Omit<Technician, 'id' | 'rating' | 'total_completed' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', specialty: '' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ name: string; email: string; username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.email) { setError('Name, phone, and email are required'); return; }
    if (password.trim() && password.trim().length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    const finalPassword = password.trim() || generatePassword();
    try {
      const profileId = await createWirelessUser({
        name: form.name.trim(),
        email: form.email.trim(),
        username: username.trim() || undefined,
        role: 'technician',
        password: finalPassword,
      });
      await onSave({ ...form, profile_id: profileId, status: 'available' });
      setResult({ name: form.name.trim(), email: form.email.trim(), username: username.trim(), password: finalPassword });
    } catch (err) {
      setError(errMessage(err, 'Failed to add technician'));
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const signInAs = result.username ? `Username: ${result.username} (or email: ${result.email})` : `Email: ${result.email}`;
    const text = `WIRELESS Tech Portal login\n${signInAs}\nPassword: ${result.password}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        {result ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Technician Added</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Share these credentials with {result.name} so they can sign into the Tech Portal.</p>
              <div className="space-y-2 rounded-xl p-4 font-mono text-sm" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{result.email}</span>
                </div>
                {result.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Username</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>{result.username}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{result.password}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={copyCredentials} className="flex-1 h-9 rounded-lg text-xs font-semibold"
                  style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </button>
                <button onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'hsl(var(--primary))' }}>
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Technician</p>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              {[
                { key: 'name',      label: 'Full Name *',  type: 'text', required: true },
                { key: 'phone',     label: 'Phone *',      type: 'tel',  required: true },
                { key: 'email',     label: 'Email *',      type: 'email',required: true },
                { key: 'specialty', label: 'Specialty',    type: 'text', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</label>
                  <input required={f.required} type={f.type} value={(form as Record<string,string>)[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                </div>
              ))}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Username <span className="opacity-60 normal-case">(optional)</span>
                </label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  placeholder="e.g. joe.a"
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Password <span className="opacity-60 normal-case">(optional — auto-generated if blank)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full h-9 pl-3 pr-9 rounded-lg text-sm outline-none"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}
                    className="px-3 h-9 rounded-lg text-xs font-medium whitespace-nowrap"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    Generate
                  </button>
                </div>
              </div>

              {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Adding…' : 'Add Technician'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Create Login Modal (for existing technicians added before logins existed) ─

function CreateLoginModal({ technician, onLinked, onClose }: {
  technician: Technician;
  onLinked: (profileId: string, email: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(technician.email || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ email: string; username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (password.trim() && password.trim().length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    const finalPassword = password.trim() || generatePassword();
    try {
      const profileId = await createWirelessUser({
        name: technician.name,
        email: email.trim(),
        username: username.trim() || undefined,
        role: 'technician',
        password: finalPassword,
      });
      await onLinked(profileId, email.trim());
      setResult({ email: email.trim(), username: username.trim(), password: finalPassword });
    } catch (err) {
      setError(errMessage(err, 'Failed to create login'));
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    const signInAs = result.username ? `Username: ${result.username} (or email: ${result.email})` : `Email: ${result.email}`;
    const text = `WIRELESS Tech Portal login\n${signInAs}\nPassword: ${result.password}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        {result ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Login Created</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Share these credentials with {technician.name} so they can sign into the Tech Portal.</p>
              <div className="space-y-2 rounded-xl p-4 font-mono text-sm" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{result.email}</span>
                </div>
                {result.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Username</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>{result.username}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Password</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{result.password}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={copyCredentials} className="flex-1 h-9 rounded-lg text-xs font-semibold"
                  style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </button>
                <button onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'hsl(var(--primary))' }}>
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Create Login for {technician.name}</p>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                This technician was added before logins existed. Create one now so they can sign into the Tech Portal.
              </p>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Email *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Username <span className="opacity-60 normal-case">(optional)</span>
                </label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  placeholder="e.g. mckay"
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Password <span className="opacity-60 normal-case">(optional — auto-generated if blank)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full h-9 pl-3 pr-9 rounded-lg text-sm outline-none"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}
                    className="px-3 h-9 rounded-lg text-xs font-medium whitespace-nowrap"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    Generate
                  </button>
                </div>
              </div>

              {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Creating…' : 'Create Login'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Edit Technician Modal ─────────────────────────────────────────────────────

function EditTechnicianModal({ technician, onSave, onClose }: {
  technician: Technician;
  onSave: (id: string, data: Partial<Technician>) => Promise<unknown>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: technician.name,
    phone: technician.phone,
    email: technician.email,
    specialty: technician.specialty,
    status: technician.status,
    unavailable_from: technician.unavailable_from ?? '',
    unavailable_until: technician.unavailable_until ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await onSave(technician.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        specialty: form.specialty,
        status: form.status,
        unavailable_from: form.status === 'unavailable' ? (form.unavailable_from || null) : null,
        unavailable_until: form.status === 'unavailable' ? (form.unavailable_until || null) : null,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Technician</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Full Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Specialty</label>
            <input value={form.specialty} onChange={e => set('specialty', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          {form.status === 'unavailable' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>From</label>
                <input type="date" value={form.unavailable_from} onChange={e => set('unavailable_from', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Until</label>
                <input type="date" value={form.unavailable_until} min={form.unavailable_from || undefined} onChange={e => set('unavailable_until', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Reassign Modal ────────────────────────────────────────────────────────────

function ReassignModal({ technicians, onClose }: { technicians: Technician[]; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Reassign Jobs</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <div className="px-5 py-6 text-center">
          <RefreshCw className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Bulk Reassign</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Select repair jobs from the technician cards and use drag-and-drop to reassign.
            {technicians.length > 0 && ` ${technicians.length} technician${technicians.length > 1 ? 's' : ''} available.`}
          </p>
          <button onClick={onClose} className="mt-4 px-4 h-8 rounded-lg text-xs font-semibold"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TechniciansPage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  const { technicians, loading, add, patch, remove } = useTechnicians();
  const { repairs } = useRepairs();
  // Receptionist can see technician availability to route tickets, but
  // creating a technician account (with login credentials) is reserved
  // for whoever actually holds people-management permission.
  const canAddTechnician = !!user?.permissions?.includes('technicians:edit');
  const isAdmin = user?.role === 'admin';
  // Admin is a protected system role that can't carry a DB-seeded
  // attendance:* permission (see the migration) — is_admin() already
  // bypasses every wireless.has_permission() check server-side, so the
  // client mirrors that with an explicit role check instead.
  const canViewAttendance = isAdmin || !!(user?.permissions?.includes('attendance:view') || user?.permissions?.includes('attendance:manage'));
  const canManageAttendance = isAdmin || !!user?.permissions?.includes('attendance:manage');
  const [tab, setTab] = useState<'roster' | 'performance' | 'attendance'>('roster');
  const [timeline, setTimeline] = useState<TimelineFilter>('24hrs');
  const [showAdd, setShowAdd] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [creatingLoginFor, setCreatingLoginFor] = useState<Technician | null>(null);
  const [page, setPage] = useState(1);

  const unavailableTechs = technicians.filter(t => isCurrentlyUnavailable(t)).length;
  const totalInQueue = useMemo(() =>
    repairs.filter(r => isActiveRepairStatus(r.status)).length,
  [repairs]);
  const unassigned = useMemo(() =>
    repairs.filter(r => isActiveRepairStatus(r.status) && !r.technicians.length).length,
  [repairs]);

  useEffect(() => {
    setPageTitle({
      title: 'Technicians',
      subtitle: `${unavailableTechs} unavailable · ${technicians.length} total`,
      action: canAddTechnician ? { label: 'Add Technician', onClick: () => setShowAdd(true) } : undefined,
      secondaryAction: { label: 'Reassign', onClick: () => setShowReassign(true) },
    });
  }, [technicians.length, unavailableTechs, canAddTechnician, setPageTitle]);

  const doneHours = filterHours(timeline);
  const doneLabel = timeline === 'All' ? 'Done (all)' : `Done (${timeline})`;

  // A ticket assigned to more than one technician counts toward each of
  // their loads/stats — both are actually working it, and there's no
  // "primary" assignee to attribute it to alone instead.
  const maxLoad = useMemo(() => {
    const loads = technicians.map(tech =>
      repairs.filter(r => r.technicians.some(t => t.id === tech.id) && isActiveRepairStatus(r.status)).length
    );
    return Math.max(1, ...loads);
  }, [technicians, repairs]);

  const techStats = useMemo(() => {
    return technicians.map(tech => {
      const myRepairs  = repairs.filter(r => r.technicians.some(t => t.id === tech.id));
      const current    = myRepairs.find(r => r.status === 'in_progress') ?? null;
      const queue      = myRepairs.filter(r => r.status !== 'in_progress' && isActiveRepairStatus(r.status));
      const activeLoad = myRepairs.filter(r => isActiveRepairStatus(r.status)).length;
      const cutoff     = doneHours ? new Date(Date.now() - doneHours * 3_600_000) : null;
      const doneRepairs = myRepairs.filter(r =>
        (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate &&
        (!cutoff || new Date(r.completedDate) >= cutoff)
      );
      const done = doneRepairs.length;

      // avg completion time in hours (createdAt/started → completedDate)
      const completedAll = myRepairs.filter(r => (r.status === 'completed' || r.status === 'diagnosis_only_closed') && r.completedDate);
      const avgCompletionHrs = completedAll.length
        ? completedAll.reduce((s, r) => s + (new Date(r.completedDate!).getTime() - new Date(r.createdAt ?? r.started).getTime()), 0)
          / completedAll.length / 3_600_000
        : null;

      return { tech, current, queue, done, activeLoad, avgCompletionHrs };
    });
  }, [technicians, repairs, doneHours]);

  useEffect(() => { setPage(1); }, [technicians.length]);

  const pagedTechStats = useMemo(() =>
    techStats.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [techStats, page]);

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Technicians',      value: loading ? '…' : technicians.length },
          { label: 'Unavailable',      value: loading ? '…' : unavailableTechs },
          { label: 'In Queue',         value: totalInQueue },
          { label: 'Unassigned',       value: unassigned },
        ].map(s => (
          <div key={s.label} className="rounded-xl border px-5 py-4"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      {(isAdmin || canViewAttendance) && (
        <div className="flex items-center gap-2 flex-wrap border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          {([
            { key: 'roster', label: 'Roster' },
            ...(isAdmin ? [{ key: 'performance', label: 'Performance' }] as const : []),
            ...(canViewAttendance ? [{ key: 'attendance', label: 'Attendance' }] as const : []),
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px"
              style={tab === t.key
                ? { color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--primary))' }
                : { color: 'hsl(var(--muted-foreground))', borderColor: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'performance' && isAdmin && <PerformanceTab technicians={technicians} repairs={repairs} />}
      {tab === 'attendance' && canViewAttendance && <AttendanceTab canManage={canManageAttendance} />}

      {tab === 'roster' && <>

      {/* Timeline filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Timeline
        </span>
        {TIMELINE_FILTERS.map(f => (
          <button key={f} onClick={() => setTimeline(f)}
            className="px-3 h-7 rounded-full text-xs font-semibold transition-colors"
            style={timeline === f
              ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }
              : { background: 'transparent', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Technician cards */}
      {loading ? (
        <div className="text-center py-16 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedTechStats.map(({ tech, current, queue, done, activeLoad, avgCompletionHrs }) => {
            const isUnavailable = isCurrentlyUnavailable(tech);
            const color      = avatarColor(tech.name);
            const loadPct    = Math.round((activeLoad / maxLoad) * 100);
            const isOverload = loadPct >= 80;
            const avgLabel   = avgCompletionHrs !== null
              ? avgCompletionHrs < 24
                ? `${Math.round(avgCompletionHrs)}h avg`
                : `${(avgCompletionHrs / 24).toFixed(1)}d avg`
              : null;

            return (
              <div key={tech.id} className="rounded-xl border overflow-hidden relative"
                style={{
                  background: 'hsl(var(--card))',
                  borderColor: isUnavailable ? 'rgba(239,68,68,0.4)' : 'hsl(var(--border))',
                  borderLeftWidth: isUnavailable ? 3 : 1,
                  borderLeftColor: isUnavailable ? '#ef4444' : 'hsl(var(--border))',
                }}>

                {/* Create Login + Edit + Delete buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {!tech.profile_id && (
                    <button
                      onClick={() => setCreatingLoginFor(tech)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: 'rgba(245,158,11,0.15)' }}
                      title="Create login — no account yet"
                    >
                      <KeyRound className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTech(tech)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'hsl(var(--muted))', opacity: 0.6 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.6'; }}
                    title="Edit technician"
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${tech.name}?`)) remove(tech.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ background: 'hsl(var(--muted))', opacity: 0.4 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.background = 'hsl(0 60% 15%)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.4'; el.style.background = 'hsl(var(--muted))'; }}
                    title="Remove technician"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                  </button>
                </div>

                <div className="p-5">
                  {/* Avatar + name row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold"
                        style={{ background: color }}>
                        {initials(tech.name)}
                      </div>
                      {/* Status dot */}
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[hsl(var(--card))]"
                        style={{ background: isUnavailable ? '#ef4444' : 'hsl(142 60% 45%)' }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>{tech.name}</p>
                        {isUnavailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>
                            UNAVAILABLE{tech.unavailable_until ? ` · back ${new Date(tech.unavailable_until + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            AVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{tech.specialty || 'General'}</p>
                    </div>
                  </div>

                  {/* Current job */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>Current Job</p>
                    {current ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>
                            {current.id}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--status-in-progress))' }}>
                            In Progress
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {current.device}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {current.customer || '—'}
                          </p>
                        </div>
                        {current.issue && (
                          <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {current.issue}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                            {timeOnJob(current.createdAt ?? current.started)} on this job
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-center py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>No active job</p>
                    )}
                  </div>

                  {/* Queue */}
                  {queue.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Queue ({queue.length})
                      </p>
                      <div className="space-y-1.5">
                        {queue.slice(0, 3).map(r => {
                          const qs = REPAIR_STATUS_META[r.status];
                          return (
                            <div key={r.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: 'hsl(var(--primary))' }}>
                                  {r.id}
                                </span>
                                <span className="text-xs truncate" style={{ color: 'hsl(var(--foreground))' }}>
                                  {r.device}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: qs.bg, color: qs.color }}>{qs.label}</span>
                            </div>
                          );
                        })}
                        {queue.length > 3 && (
                          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            +{queue.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Workload bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isOverload ? '#f59e0b' : 'hsl(var(--muted-foreground))' }}>
                      {isOverload ? 'High Load' : 'Workload'}
                    </span>
                    <span className="text-[10px] font-semibold"
                      style={{ color: isOverload ? '#f59e0b' : 'hsl(var(--muted-foreground))' }}>
                      {activeLoad} active job{activeLoad !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${loadPct}%`,
                        background: isOverload ? '#f59e0b' : '#6366f1',
                      }} />
                  </div>
                </div>

                {/* Stats footer */}
                <div className="border-t grid grid-cols-3"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="py-3 text-center border-r" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{done}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{doneLabel}</p>
                  </div>
                  <div className="py-3 text-center border-r" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{queue.length}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>In Queue</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {avgLabel ?? '—'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Completion</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {technicians.length === 0 && (
            <div className="col-span-3 rounded-xl border py-16 text-center"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <UserPlus className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>No technicians yet</p>
              {canAddTechnician && (
                <>
                  <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first technician to start tracking workloads</p>
                  <button onClick={() => setShowAdd(true)}
                    className="px-4 h-8 rounded-lg text-xs font-semibold text-white"
                    style={{ background: 'hsl(var(--primary))' }}>
                    Add Technician
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          pageCount={Math.max(1, Math.ceil(techStats.length / PAGE_SIZE))}
          total={techStats.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      </>}

      {showAdd && <AddTechnicianModal onSave={add} onClose={() => setShowAdd(false)} />}
      {editingTech && <EditTechnicianModal technician={editingTech} onSave={patch} onClose={() => setEditingTech(null)} />}
      {creatingLoginFor && (
        <CreateLoginModal
          technician={creatingLoginFor}
          onLinked={(profileId, email) => patch(creatingLoginFor.id, { profile_id: profileId, email })}
          onClose={() => setCreatingLoginFor(null)}
        />
      )}
      {showReassign && <ReassignModal technicians={technicians} onClose={() => setShowReassign(false)} />}
    </div>
  );
}
