import { useState } from 'react';
import type { CalendarEvent } from '@/services/events';
import CustomerPicker from '@/components/shared/CustomerPicker';

const typeLabels: Record<string, string> = {
  repair: 'Repair',
  consultation: 'Consultation',
  tradein: 'Trade-In',
  internal: 'Internal',
  marketing: 'Marketing',
  delivery: 'Delivery',
};

const typeColors: Record<string, string> = {
  repair: '#E05A2B',
  consultation: '#DC1F1F',
  tradein: '#F59E0B',
  internal: '#0F172A',
  marketing: '#F59E0B',
  delivery: '#06B6D4',
};

interface Props {
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onClose: () => void;
}

export default function AddEventModal({ onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('repair');
  const [duration, setDuration] = useState('30');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !customer.trim() || !date || !time) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        customer: customer.trim(),
        phone: phone.trim(),
        type,
        date,
        time,
        duration: parseInt(duration) || 30,
        status: 'confirmed',
        notes: notes.trim() || undefined,
        color: typeColors[type],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Add Appointment</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. iPhone Screen Repair"
            />
          </div>
          <CustomerPicker
            value={customer}
            phone={phone}
            onChange={(name, p) => { setCustomer(name); setPhone(p); }}
            required
            label="Customer Name"
            placeholder="Search existing or type new name…"
            theme="light"
          />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="0244-XXX-XXX"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="30"
                min="5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !customer.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap disabled:opacity-50"
            style={{ background: '#DC1F1F' }}
          >
            {saving ? 'Saving…' : 'Add Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
