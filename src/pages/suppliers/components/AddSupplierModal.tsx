import { useState } from 'react';
import type { Supplier } from '@/hooks/useSuppliers';

interface Props {
  supplier?: Supplier;
  onSave: (data: Omit<Supplier, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  onClose: () => void;
}

const categories = ['Smartphone Distributor', 'Accessories Supplier', 'Parts & Repair', 'Electronics Wholesale', 'Software & Services', 'Other'];
const paymentOptions = ['Prepaid', 'Net 7', 'Net 14', 'Net 30', 'Net 60', 'On Delivery'];

export default function AddSupplierModal({ supplier, onSave, onClose }: Props) {
  const isEdit = !!supplier;
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    category: supplier?.category ?? categories[0],
    contact: supplier?.contact ?? '',
    leadTime: supplier?.leadTime ?? '',
    paymentTerms: supplier?.paymentTerms ?? 'Net 30',
    rating: supplier?.rating ?? 5,
    notes: supplier?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          name: form.name.trim(),
          category: form.category,
          contact: form.contact.trim(),
          leadTime: form.leadTime.trim(),
          paymentTerms: form.paymentTerms,
          rating: form.rating,
          totalOrders: supplier?.totalOrders ?? 0,
          notes: form.notes.trim() || undefined,
        },
        supplier?.id,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-[14px] font-bold text-slate-800">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-sm text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Supplier Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="e.g. TechZone Distributors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Contact *</label>
              <input required value={form.contact} onChange={e => set('contact', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="Phone or email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Lead Time</label>
              <input value={form.leadTime} onChange={e => set('leadTime', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="e.g. 3-5 days" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Payment Terms</label>
              <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                {paymentOptions.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block text-slate-400">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => set('rating', star)}
                  className="cursor-pointer transition-transform hover:scale-110">
                  <i className={`${star <= form.rating ? 'ri-star-fill' : 'ri-star-line'} text-xl`}
                    style={{ color: star <= form.rating ? '#F59E0B' : '#E2E8F0' }} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="Optional notes about this supplier…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(220,31,31,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer bg-[#DC1F1F] hover:bg-[#B81616] disabled:opacity-70 transition-colors duration-150">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
