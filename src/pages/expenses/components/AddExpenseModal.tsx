import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Expense } from '@/services/wireless/expenses';

interface ExpenseCategory { id: string; name: string }

interface Props {
  categories: ExpenseCategory[];
  expense?: Expense;
  onSave: (data: Omit<Expense, 'id'>, id?: string) => Promise<void>;
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

export default function AddExpenseModal({ categories, expense, onSave, onClose }: Props) {
  const isEdit = !!expense;
  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount]           = useState(expense?.amount != null ? String(expense.amount) : '');
  const [category, setCategory]       = useState(expense?.category ?? categories[0]?.id ?? '');
  const [date, setDate]               = useState(expense?.date ?? new Date().toISOString().split('T')[0]);
  const [status, setStatus]           = useState<string>(expense?.status ?? 'Paid');
  const [notes, setNotes]             = useState(expense?.notes ?? '');
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !date) return;
    setSaving(true);
    try {
      await onSave(
        { description: description.trim(), amount: parseFloat(amount), category, date, notes: notes.trim() || undefined, status, type: 'expense' },
        expense?.id,
      );
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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field label="Description *">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Staff salaries, Screen parts…"
              className={inputCls} style={inputStyle} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (GH₵) *">
              <input type="number" min="0" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" className={inputCls} style={inputStyle} required />
            </Field>
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className={inputCls} style={inputStyle}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className={inputCls} style={inputStyle} required />
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Cancel
            </button>
            <button type="submit"
              disabled={saving || !description.trim() || !amount}
              className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
