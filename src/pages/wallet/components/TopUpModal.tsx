interface WalletCustomer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  tier: string;
}

interface Props {
  customer: WalletCustomer;
  topupAmount: string;
  onAmountChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TopUpModal({ customer, topupAmount, onAmountChange, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Top Up Wallet</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-500" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Adding credit to <strong>{customer.name}</strong>'s wallet</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (GHS)</label>
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000, 5000].map(amt => (
              <button key={amt} onClick={() => onAmountChange(amt.toString())} className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 rounded-lg text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap">
                GHS {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Payment Method</label>
            <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400">
              <option>MoMo (MTN)</option>
              <option>MoMo (Vodafone)</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">Cancel</button>
          <button onClick={onConfirm} disabled={!topupAmount || parseFloat(topupAmount) <= 0} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:opacity-90 disabled:opacity-40" style={{ background: '#EC0118' }}>
            <i className="ri-add-circle-line mr-1" />Add GHS {topupAmount ? parseInt(topupAmount).toLocaleString() : '0'}
          </button>
        </div>
      </div>
    </div>
  );
}
