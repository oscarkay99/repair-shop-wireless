import { useState } from 'react';
import type { Repair } from '@/types/repair';
import type { Customer } from '@/types/customer';
import CustomerPicker from '@/components/shared/CustomerPicker';

interface Props {
  onSave: (r: Omit<Repair, 'id'>) => Promise<unknown>;
  onClose: () => void;
}

export default function AddRepairModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState({
    customer: '', customerPhone: '', customerEmail: '', device: '', deviceType: 'Other' as string, issue: '', technician: '',
    cost: 'TBD', eta: '', warranty: false, diagnosisFee: 200, jobType: 'diagnosis_to_repair' as 'diagnosis_only' | 'diagnosis_to_repair',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.device || !form.issue) return;
    setSaving(true);
    try {
      const costNum = parseFloat(form.cost.replace(/[^0-9.]/g, '')) || 0;
      await onSave({
        ...form,
        customerId: selectedCustomer?.id,
        websiteAuthUserId: selectedCustomer?.websiteAuthUserId,
        customerEmail: form.customerEmail || selectedCustomer?.email,
        customerPhone: form.customerPhone || selectedCustomer?.phone,
        status: 'diagnosis_paid',
        jobType: form.jobType,
        serviceStage: 'diagnosis',
        quoteStatus: 'not_sent',
        diagnosisFee: form.diagnosisFee,
        diagnosisPaidAt: new Date().toISOString(),
        quoteAmount: costNum || undefined,
        costNum,
        started: new Date().toISOString().split('T')[0],
        parts: [],
        notes: [],
        payments: [
          {
            id: crypto.randomUUID(),
            type: 'diagnosis_fee',
            amount: form.diagnosisFee,
            amountLabel: `GHS ${form.diagnosisFee}`,
            status: 'paid',
            paidAt: new Date().toISOString(),
          },
        ],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(7,16,31,0.07)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>New Repair Job</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: 'rgba(220,31,31,0.08)' }}>
            <i className="ri-close-line text-sm" style={{ color: 'rgba(7,16,31,0.5)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomerPicker
              value={form.customer}
              phone={form.customerPhone}
              onChange={(name, phone, customer) => {
                set('customer', name);
                set('customerPhone', phone);
                set('customerEmail', customer?.email ?? '');
                setSelectedCustomer(customer ?? null);
              }}
              required
              label="Customer *"
            />
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Device *</label>
              <input required value={form.device} onChange={e => set('device', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="iPhone 15 Pro..." />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Issue *</label>
            <input required value={form.issue} onChange={e => set('issue', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="Screen cracked, battery dead..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Customer Email</label>
              <input value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="customer@email.com" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Customer Phone</label>
              <input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="+233..." />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Device Type</label>
            <select value={form.deviceType} onChange={e => set('deviceType', e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
              {['iPhone','Android','MacBook','iPad','Windows','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Technician</label>
              <input value={form.technician} onChange={e => set('technician', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Quoted Repair Cost</label>
              <input value={form.cost} onChange={e => set('cost', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="GHS 850 or TBD" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>ETA</label>
              <input value={form.eta} onChange={e => set('eta', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="Apr 26" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Diagnosis Fee</label>
              <input value={form.diagnosisFee} onChange={e => set('diagnosisFee', Number(e.target.value) || 200)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
                placeholder="200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Job Flow</label>
              <select value={form.jobType} onChange={e => set('jobType', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                <option value="diagnosis_to_repair">Diagnosis then repair quote</option>
                <option value="diagnosis_only">Diagnosis only</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="warranty" checked={form.warranty} onChange={e => set('warranty', e.target.checked)} className="cursor-pointer" />
              <label htmlFor="warranty" className="text-sm text-slate-600 cursor-pointer">Under Warranty</label>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(220,31,31,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer bg-[#DC1F1F] hover:bg-[#B81616] disabled:opacity-70 transition-colors duration-150">
              {saving ? 'Saving…' : 'Create Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
