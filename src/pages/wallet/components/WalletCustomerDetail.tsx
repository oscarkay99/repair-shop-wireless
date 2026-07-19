const tierConfig: Record<string, { icon: string; color: string; bg: string }> = {
  Bronze:   { icon: 'ri-medal-line',     color: 'text-amber-700',  bg: 'bg-amber-100' },
  Silver:   { icon: 'ri-medal-2-line',   color: 'text-slate-600',  bg: 'bg-slate-100' },
  Gold:     { icon: 'ri-trophy-line',    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  Platinum: { icon: 'ri-vip-crown-line', color: 'text-slate-700', bg: 'bg-slate-200' },
};

const txTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
  deposit:  { icon: 'ri-arrow-down-circle-line', color: 'text-emerald-500', label: 'Deposit' },
  purchase: { icon: 'ri-shopping-bag-3-line',    color: 'text-rose-500',    label: 'Purchase' },
  bonus:    { icon: 'ri-gift-line',              color: 'text-amber-500',   label: 'Bonus' },
};

interface WalletTransaction {
  id: string;
  type: string;
  description: string;
  date: string;
  amount: number;
  balance: number;
}

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
  transactions: WalletTransaction[];
}

interface Props {
  customer: WalletCustomer;
  onTopUp: () => void;
}

export default function WalletCustomerDetail({ customer, onTopUp }: Props) {
  const tc = tierConfig[customer.tier];

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #EC0118 100%)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${customer.avatarColor} flex items-center justify-center text-white font-bold`}>
              {customer.avatar}
            </div>
            <div>
              <p className="font-bold text-white">{customer.name}</p>
              <p className="text-white/50 text-xs">{customer.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-5 h-5 flex items-center justify-center rounded-md ${tc.bg}`}>
                  <i className={`${tc.icon} text-xs ${tc.color}`} />
                </div>
                <span className={`text-xs font-semibold ${tc.color}`}>{customer.tier} Member</span>
              </div>
            </div>
          </div>
          <button
            onClick={onTopUp}
            className="px-4 py-2 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90"
            style={{ background: '#EC0118' }}
          >
            <i className="ri-add-circle-line mr-1" />Top Up
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-0.5">Current Balance</p>
            <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>GHS {customer.balance.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-0.5">Total Deposited</p>
            <p className="text-lg font-bold text-white">GHS {customer.totalDeposited.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-0.5">Total Spent</p>
            <p className="text-lg font-bold text-white">GHS {customer.totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h4 className="text-sm font-bold text-slate-800 mb-4">Transaction History</h4>
        <div className="space-y-3">
          {customer.transactions.map(tx => {
            const cfg = txTypeConfig[tx.type];
            return (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                    <i className={`${cfg.icon} text-sm ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? '+' : ''}GHS {Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">Bal: GHS {tx.balance.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
