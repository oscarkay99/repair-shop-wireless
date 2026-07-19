import { useState } from 'react';
import { changePassword } from '@/services/wireless/users';
import { isSupabaseConfigured } from '@/services/supabase';

export default function ChangePasswordSection() {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = async () => {
    setError('');
    setSuccess(false);
    if (!newPw || !confirmPw) { setError('Both fields are required'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return; }
    if (newPw.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await changePassword(newPw);
      setSuccess(true);
      setNewPw('');
      setConfirmPw('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">Password management requires a live Supabase connection.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-semibold text-foreground mb-1">Change Password</h3>
      <p className="text-xs text-muted-foreground mb-5">Update your personal login password</p>

      <div className="max-w-sm space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
          <input
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Repeat new password"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">Password updated successfully</p>}

        <button
          onClick={handleChange}
          disabled={saving}
          className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
