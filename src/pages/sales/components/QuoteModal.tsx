interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
}

interface Props {
  cartItems: CartItem[];
  customerName: string;
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onClose: () => void;
}

function formatGHS(value: number) {
  return `GHS ${value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function quoteNumber() {
  return `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
}

export default function QuoteModal({ cartItems, customerName, deliveryType, paymentMethod, subtotal, deliveryFee, total, onClose }: Props) {
  const quoteId = quoteNumber();
  const issueDate = new Date();
  const validUntil = new Date(issueDate);
  validUntil.setDate(issueDate.getDate() + 7);

  const handlePrint = () => window.print();

  const handleShareWhatsApp = () => {
    const lines = [
      `Quote ${quoteId}`,
      `Client: ${customerName || 'Walk-in Customer'}`,
      '',
      ...cartItems.map(item => `${item.name} × ${item.qty}: ${formatGHS(item.lineTotal)}`),
      '',
      `Subtotal: ${formatGHS(subtotal)}`,
      `Delivery: ${deliveryFee > 0 ? formatGHS(deliveryFee) : 'Free'}`,
      `Total: ${formatGHS(total)}`,
      '',
      `Valid until ${validUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Quote Preview</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <i className="ri-close-line text-base" />
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 bg-slate-50/70 max-h-[calc(92vh-81px)] overflow-y-auto">
            <div className="bg-white rounded-[28px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-7 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EC0118]/6 text-[#EC0118] text-[11px] font-semibold mb-4">
                      <span className="w-2 h-2 rounded-full bg-[#EC0118]" />
                      Wireless
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quote</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-md">Structured like the TriAxis layout, with clear billing metadata, itemized lines, and a separate financial summary.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Quote No.</p>
                      <p className="text-sm font-semibold text-slate-800">{quoteId}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Currency</p>
                      <p className="text-sm font-semibold text-slate-800">GHS</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Issue Date</p>
                      <p className="text-sm font-semibold text-slate-800">{issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Valid Until</p>
                      <p className="text-sm font-semibold text-slate-800">{validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-7 space-y-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Bill To</p>
                    <p className="text-base font-bold text-slate-800">{customerName || 'Walk-in Customer'}</p>
                    <p className="text-sm text-slate-500 mt-2">Prepared by Wireless</p>
                    <p className="text-sm text-slate-500">Accra, Ghana</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Quote Details</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold text-slate-800 capitalize">{deliveryType}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">Payment Method</span><span className="font-semibold text-slate-800">{paymentMethod}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">Terms</span><span className="font-semibold text-slate-800">Due on approval</span></div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Description', 'Qty', 'Unit Price', 'Line Total'].map((label) => (
                          <th key={label} className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 py-3">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50">
                          <td className="py-4 pr-4">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400 mt-1">{item.id}</p>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{item.qty}</td>
                          <td className="py-4 text-sm text-slate-600">{formatGHS(item.price)}</td>
                          <td className="py-4 text-sm font-bold text-slate-800">{formatGHS(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Notes</p>
                    <p className="text-sm text-slate-600 leading-relaxed">This quote includes the selected items, delivery arrangement, and the quoted total in Ghana cedis. Stock remains subject to confirmation at the point of payment.</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-800">{formatGHS(subtotal)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold text-slate-800">{deliveryFee > 0 ? formatGHS(deliveryFee) : 'Free'}</span></div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200"><span className="text-slate-800 font-bold">Total</span><span className="text-xl font-black text-[#EC0118]">{formatGHS(total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-l border-slate-100 bg-white max-h-[calc(92vh-81px)] overflow-y-auto space-y-4">
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Status</div>
              <div className="p-4">
                <span className="inline-flex px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">Draft Quote</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</div>
              <div className="p-4 space-y-2">
                <button onClick={handleShareWhatsApp} className="w-full py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20b858] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
                  <i className="ri-whatsapp-line text-sm" /> Share via WhatsApp
                </button>
                <button onClick={handlePrint} className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap">
                  Print / Save PDF
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Details</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Client</span><span className="font-semibold text-slate-800">{customerName || 'Walk-in Customer'}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Items</span><span className="font-semibold text-slate-800">{cartItems.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold text-slate-800">{paymentMethod}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold text-slate-800 capitalize">{deliveryType}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
