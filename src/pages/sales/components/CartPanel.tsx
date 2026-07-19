import { useState } from 'react';

const methodIcons: Record<string, string> = {
  MoMo: 'ri-smartphone-line',
  'Bank Transfer': 'ri-bank-line',
  Cash: 'ri-money-dollar-circle-line',
  Card: 'ri-bank-card-line',
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
}

interface Props {
  cartItems: CartItem[];
  delivery: 'pickup' | 'delivery';
  payment: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onDeliveryChange: (d: 'pickup' | 'delivery') => void;
  onPaymentChange: (m: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onGenerateQuote: () => void;
  onProcessOrder: (customer: string) => void;
}

export default function CartPanel({ cartItems, delivery, payment, subtotal, deliveryFee, total, onDeliveryChange, onPaymentChange, onUpdateQty, onRemove, onGenerateQuote, onProcessOrder }: Props) {
  const [customer, setCustomer] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleComplete = async () => {
    if (cartItems.length === 0) return;
    setProcessing(true);
    await onProcessOrder(customer || 'Walk-in Customer');
    setProcessing(false);
    setDone(true);
    setCustomer('');
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Current Sale</h3>

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 mx-auto mb-3">
            <i className="ri-shopping-cart-line text-xl text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">Add products to start a sale</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1.5">Customer</p>
            <input
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full text-sm rounded-xl px-3 py-2 outline-none border border-slate-200 bg-slate-50 text-slate-700"
            />
          </div>

          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-[0.08em]">Rec</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.id} · GHS {item.price.toLocaleString()} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 cursor-pointer">
                    <i className="ri-subtract-line text-xs" />
                  </button>
                  <span className="w-5 text-center text-xs font-semibold">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 cursor-pointer">
                    <i className="ri-add-line text-xs" />
                  </button>
                </div>
                <button onClick={() => onRemove(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 cursor-pointer">
                  <i className="ri-close-line text-xs" />
                </button>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Delivery Method</p>
            <div className="flex gap-2">
              {(['pickup', 'delivery'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onDeliveryChange(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap capitalize ${
                    delivery === d ? 'bg-[#EC0118] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {['MoMo', 'Bank Transfer', 'Cash', 'Card'].map((m) => (
                <button
                  key={m}
                  onClick={() => onPaymentChange(m)}
                  className={`flex items-center gap-1.5 py-2 px-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                    payment === m ? 'bg-[rgba(236,1,24,0.06)] border border-[#EC0118]/30 text-[#EC0118]' : 'bg-slate-50 border border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className={`${methodIcons[m]} text-xs`} />
                  </div>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-800">GHS {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Delivery</span>
              <span className="text-slate-800">{deliveryFee > 0 ? `GHS ${deliveryFee}` : 'Free'}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-50">
              <span className="text-slate-800">Total</span>
              <span className="text-slate-900">GHS {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onGenerateQuote}
              className="w-full py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              Generate Quote
            </button>
            <button
              onClick={handleComplete}
              disabled={processing}
              className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
              style={{ background: done ? '#10B981' : '#EC0118', opacity: processing ? 0.7 : 1 }}
            >
              {done ? 'Sale Recorded!' : processing ? 'Processing…' : 'Complete Sale'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
