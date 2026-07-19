import { useState } from 'react';
import CustomerPicker from '@/components/shared/CustomerPicker';

interface WalletCustomer {
  id: string;
  name: string;
  phone: string;
  tier: string;
  avatar: string;
  avatarColor: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  transactions: never[];
}

interface Props {
  onAdd: (customer: WalletCustomer) => void;
  onClose: () => void;
}

const avatarColors = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];

function getTier(balance: number) {
  if (balance >= 7000) return 'Platinum';
  if (balance >= 3000) return 'Gold';
  if (balance >= 1000) return 'Silver';
  return 'Bronze';
}

export default function AddWalletCustomerModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const balance = parseFloat(initialBalance) || 0;
    const avatar = name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarColor = avatarColors[name.charCodeAt(0) % avatarColors.length];
    onAdd({
      id: `WC-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      tier: getTier(balance),
      avatar,
      avatarColor,
      balance,
      totalDeposited: balance,
      totalSpent: 0,
      transactions: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,16,31,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(7,16,31,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Add Wallet Customer</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-sm text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <CustomerPicker
            value={name}
            phone={phone}
            onChange={(n, p) => { setName(n); setPhone(p); }}
            required
            label="Customer"
            placeholder="Search or type customer name"
          />
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="e.g. 0244000000"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Opening Balance (GHS)</label>
            <input
              type="number"
              min="0"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
              style={{ border: '1px solid rgba(7,16,31,0.12)', background: 'rgba(7,16,31,0.02)', color: '#0F172A' }}
              placeholder="0.00"
            />
            {initialBalance && (
              <p className="text-[10px] text-slate-400 mt-1">
                Tier: <span className="font-semibold text-slate-600">{getTier(parseFloat(initialBalance) || 0)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: 'rgba(236,1,24,0.08)', color: 'rgba(7,16,31,0.6)' }}>
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
              style={{ background: '#25D366' }}>
              Add to Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
