import { useState } from 'react';
import type { Customer, CustomerSegment } from '@/types/customer';

interface Props {
  onSave: (c: Omit<Customer, 'id'>) => Promise<unknown>;
  onClose: () => void;
}

const segments: CustomerSegment[] = ['New', 'Repeat', 'VIP', 'At-Risk'];

export default function AddCustomerModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', segment: 'New' as CustomerSegment });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        name,
        phone,
        email: form.email.trim(),
        ltv: 'GHS 0',
        orders: 0,
        lastOrder: '—',
        avgOrder: 'GHS 0',
        warranties: 0,
        repairs: 0,
        since: new Date().toLocaleDateString('en-GH', { month: 'short', year: 'numeric' }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(7,16,31,0.07)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>New Customer</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(236,1,24,0.08)' }}>
            <i className="ri-close-line text-sm" style={{ color: 'rgba(7,16,31,0.5)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Full Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="Kwame Asante" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Phone *</label>
            <input required value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="+233 24 123 4567" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="kwame@email.com" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Segment</label>
            <select value={form.segment} onChange={e => set('segment', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none cursor-pointer"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
              {segments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(236,1,24,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer bg-[#EC0118] hover:bg-[#BD0113] disabled:opacity-70 transition-colors duration-150">
              {saving ? 'Saving…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
