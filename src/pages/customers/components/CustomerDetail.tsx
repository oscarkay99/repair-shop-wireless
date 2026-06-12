import { Customer } from '@/types/customer';

const segmentConfig: Record<string, { label: string; color: string }> = {
  VIP: { label: 'VIP', color: 'bg-amber-100 text-amber-700' },
  Repeat: { label: 'Repeat', color: 'bg-slate-100 text-slate-700' },
  New: { label: 'New', color: 'bg-emerald-100 text-emerald-700' },
  'At-Risk': { label: 'At-Risk', color: 'bg-red-100 text-red-600' },
};

interface Props {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerDetail({ customer, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800">Customer Profile</h3>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
              <i className="ri-close-line text-base" />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${customer.segment === 'VIP' ? 'bg-amber-500' : customer.segment === 'At-Risk' ? 'bg-red-500' : 'bg-emerald-500'}`}>
              {customer.name[0]}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{customer.name}</h4>
              <p className="text-xs text-slate-400">{customer.phone}</p>
              <p className="text-xs text-slate-400">{customer.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{customer.ltv}</p>
              <p className="text-[10px] text-slate-400">Lifetime Value</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{customer.orders}</p>
              <p className="text-[10px] text-slate-400">Orders</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{customer.avgOrder}</p>
              <p className="text-[10px] text-slate-400">Avg Order</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Segment</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${segmentConfig[customer.segment].color}`}>{customer.segment}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Customer Since</span>
              <span className="text-xs font-medium text-slate-800">{customer.since}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Last Order</span>
              <span className="text-xs font-medium text-slate-800">{customer.lastOrder}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Active Warranties</span>
              <span className="text-xs font-medium text-slate-800">{customer.warranties}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">Repair History</span>
              <span className="text-xs font-medium text-slate-800">{customer.repairs} repairs</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${customer.name}, we have a special offer for you! Contact us at Wireless.`)}`, '_blank')}
              className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap"
            >
              Send Offer
            </button>
            <button
              onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
