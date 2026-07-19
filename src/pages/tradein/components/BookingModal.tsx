import { useState } from 'react';
import CustomerPicker from '@/components/shared/CustomerPicker';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  selectedModel: string;
  tradeValue: number;
  onClose: () => void;
}

export default function BookingModal({ selectedModel, tradeValue, onClose }: Props) {
  const { showToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [datetime, setDatetime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Book Trade-In Appointment</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-500" />
          </button>
        </div>
        <div className="space-y-4">
          <CustomerPicker
            value={customerName}
            phone={phone}
            onChange={(name, p) => { setCustomerName(name); setPhone(p); }}
            label="Customer Name"
            placeholder="Search existing or type new name…"
            theme="light"
          />
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="+233 XX XXX XXXX"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Preferred Date & Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={e => setDatetime(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-slate-600">Device: <strong>{selectedModel}</strong></p>
            <p className="text-xs text-slate-600">Estimated value: <strong className="text-emerald-600">GHS {tradeValue.toLocaleString()}</strong></p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
          <button
            onClick={() => {
              if (!customerName) return;
              showToast(`Trade-in appointment booked for ${customerName}`);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90"
            style={{ background: '#EC0118' }}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
