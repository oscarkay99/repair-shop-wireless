import { useState } from 'react';
import CustomerPicker from '@/components/shared/CustomerPicker';
import type { WarrantyReturn } from '@/hooks/useWarranty';

interface Props {
  onClose: () => void;
  onSave: (r: Omit<WarrantyReturn, 'id'>) => void;
}

export default function NewReturnModal({ onClose, onSave }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [device, setDevice] = useState('');
  const [imei, setImei] = useState('');
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState('Exchange');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">New Return Request</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
            <i className="ri-close-line text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="space-y-4">
          <CustomerPicker
            value={customerName}
            phone={customerPhone}
            onChange={(name, phone) => { setCustomerName(name); setCustomerPhone(phone); }}
            label="Customer Name"
            placeholder="Search existing or type new name…"
            theme="light"
          />
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Device / Product</label>
            <input
              type="text"
              value={device}
              onChange={e => setDevice(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
              placeholder="e.g. iPhone 15 Pro 256GB"
            />
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">IMEI / Serial Number</label>
            <input
              type="text"
              value={imei}
              onChange={e => setImei(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
              placeholder="15-digit IMEI"
            />
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Reason for Return</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))] resize-none"
              rows={3}
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Resolution Type</label>
            <select
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
            >
              <option>Exchange</option>
              <option>Full Refund</option>
              <option>Partial Refund</option>
              <option>Repair Under Warranty</option>
            </select>
          </div>
          <button
            onClick={() => {
              if (!customerName || !device || !reason) return;
              onSave({
                customer: customerName,
                product: `${device}${imei ? ` (${imei})` : ''}`,
                issue: reason,
                status: 'pending',
                date: new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' }),
                notes: resolution,
              });
              onClose();
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#E05A2B' }}
          >
            Submit Return Request
          </button>
        </div>
      </div>
    </div>
  );
}
