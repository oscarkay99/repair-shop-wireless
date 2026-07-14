import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTechnicians } from '@/hooks/useTechnicians';
import type { Repair } from '@/types/repair';
import type { Customer } from '@/types/customer';
import CustomerPicker from '@/components/shared/CustomerPicker';

interface Props {
  onSave: (r: Omit<Repair, 'id'>) => Promise<unknown>;
  onClose: () => void;
  repairs: Repair[];
  defaultJobType?: 'diagnosis_only' | 'diagnosis_to_repair';
  initial?: Repair;
  onUpdate?: (id: string, patch: Partial<Repair>) => Promise<unknown>;
}

const ACTIVE_STATUSES = new Set<Repair['status']>([
  'received', 'diagnosis_paid', 'diagnosing', 'awaiting_approval', 'parts_pending', 'in_progress', 'ready',
]);

export default function AddRepairModal({ onSave, onClose, repairs, defaultJobType, initial, onUpdate }: Props) {
  const [form, setForm] = useState({
    customer: initial?.customer ?? '',
    customerPhone: initial?.customerPhone ?? '',
    customerEmail: initial?.customerEmail ?? '',
    device: initial?.device ?? '',
    deviceType: (initial?.deviceType ?? 'Other') as string,
    issue: initial?.issue ?? '',
    technician: initial?.technician ?? '',
    cost: initial?.cost ?? 'TBD',
    eta: initial?.eta ?? '',
    warranty: initial?.warranty ?? false,
    diagnosisFee: initial?.diagnosisFee ?? 200,
    jobType: (initial?.jobType ?? defaultJobType ?? 'diagnosis_to_repair') as 'diagnosis_only' | 'diagnosis_to_repair',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const { technicians } = useTechnicians();
  const lockJobType = !!defaultJobType && !initial;

  const activeLoadByName = repairs
    .filter(r => ACTIVE_STATUSES.has(r.status))
    .reduce<Record<string, number>>((acc, r) => {
      if (r.technician) acc[r.technician] = (acc[r.technician] ?? 0) + 1;
      return acc;
    }, {});

  const sortedTechnicians = [...technicians].sort((a, b) =>
    (activeLoadByName[a.name] ?? 0) - (activeLoadByName[b.name] ?? 0)
  );

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.device || !form.issue) return;
    setSaving(true);
    try {
      const costNum = parseFloat(form.cost.replace(/[^0-9.]/g, '')) || 0;

      if (initial && onUpdate) {
        await onUpdate(initial.id, {
          customer: form.customer,
          customerId: selectedCustomer?.id ?? initial.customerId,
          websiteAuthUserId: selectedCustomer?.websiteAuthUserId ?? initial.websiteAuthUserId,
          customerEmail: form.customerEmail || selectedCustomer?.email || initial.customerEmail,
          customerPhone: form.customerPhone || selectedCustomer?.phone || initial.customerPhone,
          device: form.device,
          deviceType: form.deviceType,
          issue: form.issue,
          technician: form.technician,
          cost: form.cost,
          costNum,
          eta: form.eta,
          warranty: form.warranty,
          diagnosisFee: form.diagnosisFee,
          jobType: form.jobType,
        });
      } else {
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
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(7,16,31,0.07)' }}>
          <h3 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>
            {initial ? 'Edit Job' : defaultJobType === 'diagnosis_only' ? 'New Diagnosis' : 'New Repair Job'}
          </h3>
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
                placeholder="e.g. Galaxy S24, MacBook Air..." />
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
              {['Phone','Tablet','Laptop','Desktop','Smartwatch','Console','Camera','Audio','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'rgba(7,16,31,0.4)' }}>Technician</label>
              <select value={form.technician} onChange={e => set('technician', e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                <option value="">Unassigned</option>
                {sortedTechnicians.map(t => {
                  const load = activeLoadByName[t.name] ?? 0;
                  return (
                    <option key={t.id} value={t.name}>
                      {t.name} — {load === 0 ? 'free' : `${load} active job${load > 1 ? 's' : ''}`}
                      {t.status === 'off_duty' ? ' (off duty)' : ''}
                    </option>
                  );
                })}
              </select>
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
              {lockJobType ? (
                <div className="w-full text-sm rounded-xl px-3 py-2"
                  style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.04)', color: 'rgba(7,16,31,0.6)' }}>
                  {defaultJobType === 'diagnosis_only' ? 'Diagnosis only' : 'Diagnosis then repair quote'}
                </div>
              ) : (
                <select value={form.jobType} onChange={e => set('jobType', e.target.value)}
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}>
                  <option value="diagnosis_to_repair">Diagnosis then repair quote</option>
                  <option value="diagnosis_only">Diagnosis only</option>
                </select>
              )}
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
              {saving ? 'Saving…' : initial ? 'Save Changes' : defaultJobType === 'diagnosis_only' ? 'Create Diagnosis' : 'Create Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
