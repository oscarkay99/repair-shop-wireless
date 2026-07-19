import { useState } from 'react';
import type { Lead, LeadStatus, LeadSource } from '@/types/lead';
import CustomerPicker from '@/components/shared/CustomerPicker';

interface Props {
  defaultStatus?: LeadStatus;
  onSave: (l: Omit<Lead, 'id'>) => Promise<unknown>;
  onClose: () => void;
}

const sources: LeadSource[] = ['WhatsApp', 'Instagram', 'TikTok', 'SMS', 'Walk-in', 'Referral', 'Website'];
const statuses: LeadStatus[] = ['hot', 'warm', 'cold'];

export default function AddLeadModal({ defaultStatus = 'warm', onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: '', phone: '', source: 'WhatsApp' as LeadSource,
    status: defaultStatus, product: '', budget: '',
    assigned: '', notes: '', followUp: '', quoteReady: false,
    lastContact: 'just now',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(7,16,31,0.07)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>New Lead</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(236,1,24,0.08)' }}>
            <i className="ri-close-line text-sm" style={{ color: 'rgba(7,16,31,0.5)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <CustomerPicker
            value={form.name}
            phone={form.phone}
            onChange={(name, phone) => setForm(p => ({ ...p, name, phone }))}
            required
            label="Customer *"
            placeholder="Search existing or type new name…"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Phone *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="+233 24 …" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value as LeadSource)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Temperature</label>
              <select value={form.status} onChange={e => set('status', e.target.value as LeadStatus)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {statuses.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Assigned To</label>
              <input value={form.assigned} onChange={e => set('assigned', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="Kofi M." />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Product Interest</label>
            <input value={form.product} onChange={e => set('product', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="e.g. iPhone 15 Pro Max" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Budget</label>
            <input value={form.budget} onChange={e => set('budget', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="GHS 8,000–9,000" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none resize-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="Any additional context..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(236,1,24,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer bg-[#EC0118] hover:bg-[#BD0113] disabled:opacity-70 transition-colors duration-150">
              {saving ? 'Saving…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
