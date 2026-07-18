interface LoyaltyCustomer { id: string; name: string; points: number; tier: string }
interface LoyaltyReward { id: string; name: string; points: number }

interface Props {
  customers: LoyaltyCustomer[];
  rewards: LoyaltyReward[];
  selectedReward: string;
  onRewardChange: (id: string) => void;
  onClose: () => void;
}

export default function RedeemModal({ customers, rewards, selectedReward, onRewardChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Redeem Points</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
            <i className="ri-close-line text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Select Member</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]">
              <option>Choose member...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.points.toLocaleString()} pts ({c.tier})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Select Reward</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border))]"
              value={selectedReward}
              onChange={(e) => onRewardChange(e.target.value)}
            >
              <option value="">Choose reward...</option>
              {rewards.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.points.toLocaleString()} pts</option>
              ))}
            </select>
          </div>
          <div className="p-3 bg-[hsl(var(--muted))] rounded-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[hsl(var(--muted-foreground))]">Current Points</span>
              <span className="font-semibold text-[hsl(var(--foreground))]">8,200</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[hsl(var(--muted-foreground))]">Cost</span>
              <span className="font-semibold text-[hsl(var(--foreground))]">-5,000</span>
            </div>
            <div className="h-px bg-[hsl(var(--muted))] my-1" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Remaining</span>
              <span className="font-semibold" style={{ color: '#F59E0B' }}>3,200</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#DC1F1F' }}>
            Confirm Redemption
          </button>
        </div>
      </div>
    </div>
  );
}
