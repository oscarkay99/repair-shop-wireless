const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  delivered:  { label: 'Delivered',   color: '#25D366', bg: '#25D36615' },
  in_transit: { label: 'In Transit',  color: '#EC0118', bg: 'rgba(236,1,24,0.08)' },
  pending:    { label: 'Pending',     color: '#F59E0B', bg: '#F59E0B15' },
  cancelled:  { label: 'Cancelled',   color: '#E05A2B', bg: '#E05A2B15' },
};

interface POItem { name: string; qty: number; unitCost: number; total: number }
interface PurchaseOrder {
  id: string;
  supplier: string;
  status: string;
  orderedDate: string;
  expectedDate: string;
  deliveredDate?: string;
  totalValue: number;
  notes?: string;
  items: POItem[];
}

interface Props {
  order: PurchaseOrder;
}

export default function PurchaseOrderDetail({ order }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">{order.id}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: statusConfig[order.status].color }}>
          {statusConfig[order.status].label}
        </span>
      </div>
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-500">Supplier</span>
          <span className="font-semibold text-slate-800">{order.supplier}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-500">Ordered</span>
          <span className="text-slate-700">{order.orderedDate}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-500">Expected</span>
          <span className="text-slate-700">{order.expectedDate}</span>
        </div>
        {order.deliveredDate && (
          <div className="flex justify-between py-1.5 border-b border-slate-50">
            <span className="text-slate-500">Delivered</span>
            <span className="text-green-600 font-semibold">{order.deliveredDate}</span>
          </div>
        )}
      </div>
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Items</p>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-slate-400">Qty: {item.qty} · GHS {item.unitCost.toLocaleString()} each</p>
              </div>
              <p className="font-bold text-slate-800">GHS {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-sm font-bold pt-3 border-t border-slate-100 mb-4">
        <span>Total</span>
        <span style={{ color: '#EC0118' }}>GHS {order.totalValue.toLocaleString()}</span>
      </div>
      {order.notes && (
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-slate-400 mb-1">Notes</p>
          <p className="text-xs text-slate-600">{order.notes}</p>
        </div>
      )}
      {order.status === 'in_transit' && (
        <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#EC0118' }}>
          Mark as Delivered
        </button>
      )}
    </div>
  );
}
