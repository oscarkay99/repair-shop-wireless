import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { LeaveType } from '@/services/wireless/leave';

interface Props {
  types: LeaveType[];
  onSave: (input: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) => Promise<unknown>;
  onClose: () => void;
}

const inputCls = "w-full h-9 px-3 rounded-lg text-sm outline-none";
const inputStyle = {
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1"
        style={{ color: 'hsl(var(--muted-foreground))' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// Shared by ProfilePage's self-service "My Leave" tab and HR's file-on-
// behalf flow in StaffLeaveTab — same form either way, just a different
// profileId passed by the caller's onSave.
export default function LeaveRequestForm({ types, onSave, onClose }: Props) {
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;
    setSaving(true);
    try {
      await onSave({ leaveTypeId, startDate, endDate, reason: reason.trim() || undefined });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Request Leave</h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field label="Leave Type *">
            <select value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} className={inputCls} style={inputStyle} required>
              {types.map(t => <option key={t.id} value={t.id}>{t.label}{!t.paid ? ' (Unpaid)' : ''}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date *">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} style={inputStyle} required />
            </Field>
            <Field label="End Date *">
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={inputCls} style={inputStyle} required />
            </Field>
          </div>

          <Field label="Reason">
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Optional — a short note for whoever approves this"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !leaveTypeId}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
