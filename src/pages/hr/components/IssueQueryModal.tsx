import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { StaffQueryCategory } from '@/services/wireless/staffQueries';

interface Props {
  staffName: string;
  onSave: (input: { subject: string; category: StaffQueryCategory; dueDate?: string; body: string }) => Promise<unknown>;
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

const CATEGORIES: { id: StaffQueryCategory; label: string }[] = [
  { id: 'conduct', label: 'Conduct' },
  { id: 'performance', label: 'Performance' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'policy', label: 'Policy' },
  { id: 'other', label: 'Other' },
];

export default function IssueQueryModal({ staffName, onSave, onClose }: Props) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<StaffQueryCategory>('conduct');
  const [dueDate, setDueDate] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await onSave({ subject: subject.trim(), category, dueDate: dueDate || undefined, body: body.trim() });
      onClose();
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Issue Query</h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>To {staffName} — they'll be required to respond</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field label="Subject *">
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Late arrival on 12 Sept"
              className={inputCls} style={inputStyle} required />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value as StaffQueryCategory)} className={inputCls} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Response Due">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <Field label="Query *">
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder="Explain what's being queried and what response is expected…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} required />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !subject.trim() || !body.trim()}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Issuing…' : 'Issue Query'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
