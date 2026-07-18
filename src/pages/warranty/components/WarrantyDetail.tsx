const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active:        { label: 'Active',        color: '#25D366', bg: '#25D36615' },
  expiring_soon: { label: 'Expiring Soon', color: '#F59E0B', bg: '#F59E0B15' },
  expired:       { label: 'Expired',       color: '#94A3B8', bg: '#94A3B815'   },
};

interface Warranty {
  id: string;
  customer: string;
  phone: string;
  device: string;
  imei: string;
  purchaseDate: string;
  expiryDate: string;
  type: string;
  duration: string;
  saleId: string;
  cost: number;
  status: string;
  daysLeft: number;
}

interface Props {
  warranty: Warranty;
  onClose: () => void;
  onNewReturn: () => void;
}

export default function WarrantyDetail({ warranty, onClose, onNewReturn }: Props) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Warranty Details</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] cursor-pointer">
          <i className="ri-close-line text-[hsl(var(--muted-foreground))] text-sm" />
        </button>
      </div>
      <div className="w-full h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${warranty.status === 'expired' ? 100 : Math.max(5, 100 - (warranty.daysLeft / 365) * 100)}%`,
            background: warranty.status === 'active' ? '#25D366' : warranty.status === 'expiring_soon' ? '#F59E0B' : '#94A3B8',
          }}
        />
      </div>
      <div className="space-y-2 text-xs">
        {[
          { label: 'Customer', value: warranty.customer },
          { label: 'Phone', value: warranty.phone },
          { label: 'Device', value: warranty.device },
          { label: 'IMEI', value: warranty.imei },
          { label: 'Purchase Date', value: warranty.purchaseDate },
          { label: 'Expiry Date', value: warranty.expiryDate },
          { label: 'Type', value: warranty.type },
          { label: 'Duration', value: warranty.duration },
          { label: 'Sale ID', value: warranty.saleId },
          { label: 'Purchase Price', value: `GHS ${warranty.cost.toLocaleString()}` },
        ].map(item => (
          <div key={item.label} className="flex justify-between py-1.5 border-b border-[hsl(var(--border))]">
            <span className="text-[hsl(var(--muted-foreground))]">{item.label}</span>
            <span className="font-semibold text-[hsl(var(--foreground))] text-right">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onNewReturn} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#E05A2B' }}>
          Log Return
        </button>
        <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] cursor-pointer whitespace-nowrap">
          Extend Warranty
        </button>
      </div>
    </div>
  );
}
