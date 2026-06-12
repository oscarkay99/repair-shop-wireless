import { useRef } from 'react';
import type { CartItem, TradeIn } from '../page';
import type { PosCustomer } from '@/mocks/pos';


interface Props {
  cart: CartItem[];
  customer: PosCustomer | null;
  total: number;
  tradeIn: TradeIn | null;
  paymentMethod: string;
  plan: string;
  onNewSale: () => void;
}

function formatGHS(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function receiptNumber() {
  return `ITH-${Date.now().toString(36).toUpperCase()}`;
}

function warrantyMonths(type: string): number {
  if (type === 'phone' || type === 'tablet' || type === 'laptop') return 12;
  if (type === 'wearable' || type === 'audio') return 6;
  return 3;
}

function warrantyExpiry(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AiReceiptModal({ cart, customer, total, tradeIn, paymentMethod, plan, onNewSale }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const txn = receiptNumber();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
  const isPaid = plan.toLowerCase().includes('cash') || paymentMethod.toLowerCase() !== 'installment';

  const warrantyItems = cart.filter(i => warrantyMonths(i.product.type) >= 6);
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty * (1 - item.discount / 100)), 0);

  function buildReceiptText() {
    const lines: string[] = [
      `*Wireless — ${isPaid ? 'Receipt' : 'Invoice'} #${txn}*`,
      '',
      `Customer: ${customer?.name ?? 'Walk-in Customer'}`,
      `Date: ${dateStr} · ${timeStr}`,
      `Payment: ${paymentMethod}`,
      '',
      '*Items:*',
      ...cart.map(item => {
        const line = item.product.price * item.qty * (1 - item.discount / 100);
        return `• ${item.product.name} (×${item.qty}) — ${formatGHS(line)}${item.discount > 0 ? ` [${item.discount}% off]` : ''}`;
      }),
      '',
      `*Total: ${formatGHS(total)}*`,
      '',
      'Returns accepted within 7 days with this receipt.',
      'Thank you for shopping with us!',
      'hello@fixhub.com · fixhub.com',
    ];
    return lines.join('\n');
  }

  function handleSendWhatsApp() {
    const raw = customer?.phone ?? '';
    const digits = raw.replace(/\D/g, '');
    const phone = digits.startsWith('0') ? `233${digits.slice(1)}` : digits;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildReceiptText())}`;
    window.open(url, '_blank');
  }

  function handleSendEmail() {
    const email = customer?.email ?? '';
    const subject = encodeURIComponent(`Your Receipt from Wireless — #${txn}`);
    const body = encodeURIComponent(
      buildReceiptText().replace(/\*/g, ''),
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  }

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=780,height=900');
    if (!win) return;
    win.document.write(`
      <html><head><title>${isPaid ? 'Receipt' : 'Invoice'} ${txn}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e1e1e; background:#fff; padding:32px; max-width:740px; margin:0 auto; }
        .rcp-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
        .rcp-logo { height:48px; width:auto; display:block; margin-bottom:4px; }
        .rcp-company-address { font-size:11px; color:#5f7184; line-height:1.6; }
        .rcp-watermark { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:0; }
        .rcp-watermark img { width:320px; opacity:0.04; filter:grayscale(100%); }
        .rcp-content { position:relative; z-index:1; }
        .rcp-title-block { text-align:right; }
        .rcp-paid-stamp { display:inline-block; border:3px solid #16a34a; color:#16a34a; font-size:13px; font-weight:800; padding:4px 12px; border-radius:4px; transform:rotate(-8deg); margin-bottom:8px; letter-spacing:.08em; }
        .rcp-title { font-size:26px; font-weight:800; color:#1e1e1e; }
        .rcp-number { font-size:12px; color:#5f7184; margin-top:3px; }
        hr { border:none; border-top:1px solid #e0e0e0; margin:18px 0; }
        .rcp-middle { display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; }
        .rcp-field-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#5f7184; margin-bottom:5px; }
        .rcp-client-name { font-size:14px; font-weight:700; color:#1e1e1e; }
        .rcp-client-detail { font-size:12px; color:#5f7184; margin-top:2px; }
        .rcp-meta-table { min-width:260px; border:1px solid #e0e0e0; border-radius:6px; overflow:hidden; }
        .rcp-meta-row { display:flex; justify-content:space-between; padding:8px 14px; border-bottom:1px solid #e0e0e0; font-size:12px; }
        .rcp-meta-row:last-child { border-bottom:none; }
        .rcp-meta-label { color:#5f7184; }
        .rcp-meta-value { font-weight:600; color:#1e1e1e; }
        .rcp-balance-row { background:#eff6ff; }
        .rcp-balance-label { font-weight:700; color:#1e1e1e; }
        .rcp-balance-value { font-weight:800; color:#002d55; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        thead tr { background:#333; color:#fff; }
        thead th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
        tbody tr { border-bottom:1px solid #f0f0f0; }
        tbody tr:nth-child(even) { background:#fafafa; }
        tbody td { padding:10px 12px; font-size:12px; color:#1e1e1e; }
        .rcp-totals { display:flex; justify-content:flex-end; margin-bottom:20px; }
        .rcp-totals table { width:280px; }
        .rcp-totals td { padding:6px 12px; font-size:12px; }
        .rcp-totals .rcp-tot-label { color:#5f7184; }
        .rcp-totals .rcp-tot-val { text-align:right; font-weight:600; }
        .rcp-tot-total td { font-size:15px; font-weight:800; border-top:2px solid #e0e0e0; padding-top:10px; }
        .rcp-note-block { margin-top:16px; padding:12px; background:#f8fafc; border-radius:6px; }
        .rcp-note-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#5f7184; margin-bottom:5px; }
        .rcp-note-text { font-size:11px; color:#444; line-height:1.6; }
        .warranty-section { margin-top:16px; }
        .warranty-item { border:1px solid #002d5520; border-radius:6px; padding:10px 14px; margin-bottom:8px; }
        .warranty-title { font-size:11px; font-weight:700; color:#002d55; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
        .warranty-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px; }
        .warranty-key { color:#5f7184; }
        .footer { margin-top:24px; text-align:center; font-size:11px; color:#5f7184; border-top:1px solid #e0e0e0; padding-top:14px; }
        @media print { body { padding:16px; } }
      </style>
      </head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onNewSale}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-emerald-600 text-xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Sale Complete</p>
              <p className="text-[10px] text-slate-400">{txn}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr]">

          {/* Receipt preview */}
          <div className="p-6 bg-[#f0f4f8] max-h-[calc(92vh-81px)] overflow-y-auto">
            <div ref={receiptRef} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">

              {/* Watermark */}
              <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
                <img style={{ display: 'none' }} alt="" className="w-[340px] opacity-[0.04]" style={{ filter: 'grayscale(100%)' }} />
              </div>

              {/* All receipt content sits above the watermark */}
              <div style={{ position: 'relative', zIndex: 1 }}>

              {/* Top: company logo + title block */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-5">
                <div>
                  <img style={{ display: 'none' }} alt="Wireless" className="h-12 w-auto mb-1" />
                  <p className="text-[11px] leading-relaxed" style={{ color: '#5f7184' }}>
                    Accra, Ghana<br />
                    hello@fixhub.com · fixhub.com
                  </p>
                </div>
                <div className="sm:text-right">
                  {isPaid && (
                    <div className="inline-block border-2 border-green-600 text-green-600 text-[11px] font-black px-3 py-1 rounded mb-2 tracking-widest uppercase" style={{ transform: 'rotate(-8deg)' }}>
                      PAID
                    </div>
                  )}
                  <p className="text-[26px] font-black text-slate-900 leading-none">{isPaid ? 'RECEIPT' : 'INVOICE'}</p>
                  <p className="text-[11px] mt-1" style={{ color: '#5f7184' }}># {txn}</p>
                </div>
              </div>

              <hr className="border-slate-200 mb-5" />

              {/* Middle: Bill To + Meta table */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5f7184' }}>Bill To</p>
                  {customer ? (
                    <>
                      <p className="text-[14px] font-bold text-slate-900">{customer.name}</p>
                      {customer.phone && <p className="text-[12px] mt-1" style={{ color: '#5f7184' }}>{customer.phone}</p>}
                      {customer.email && <p className="text-[12px]" style={{ color: '#5f7184' }}>{customer.email}</p>}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <i className="ri-user-line text-slate-400 text-sm" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-500">Walk-in Customer</p>
                        <p className="text-[10px] text-slate-400">No account attached</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden min-w-[260px]">
                  {[
                    { label: 'Date', value: `${dateStr} · ${timeStr}` },
                    { label: 'Payment Method', value: paymentMethod },
                    { label: 'Plan', value: plan },
                    { label: 'Reference', value: txn },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between px-3.5 py-2 border-b border-slate-100 last:border-0 text-[12px]">
                      <span style={{ color: '#5f7184' }}>{row.label}</span>
                      <span className="font-semibold text-slate-800">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3.5 py-2.5 text-[12px]" style={{ background: '#eff6ff' }}>
                    <span className="font-bold text-slate-800">Total Paid</span>
                    <span className="font-black" style={{ color: '#002d55' }}>{formatGHS(total)}</span>
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr style={{ background: '#333' }}>
                      {['Item', 'Qty', 'Unit Price', 'Amount'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const lineTotal = item.product.price * item.qty * (1 - item.discount / 100);
                      return (
                        <tr key={item.product.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }} className="border-b border-slate-100">
                          <td className="px-3 py-3">
                            <p className="text-[13px] font-semibold text-slate-800">{item.product.name}</p>
                            {item.imeiEntered && <p className="text-[10px] mt-0.5" style={{ color: '#5f7184' }}>IMEI: {item.imeiEntered}</p>}
                            {item.discount > 0 && <p className="text-[10px] text-amber-600 mt-0.5">{item.discount}% discount applied</p>}
                          </td>
                          <td className="px-3 py-3 text-[12px] text-slate-600">{item.qty}</td>
                          <td className="px-3 py-3 text-[12px] text-slate-600">{formatGHS(item.product.price)}</td>
                          <td className="px-3 py-3 text-[13px] font-bold text-slate-800">{formatGHS(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <table className="w-[280px] border-collapse text-[12px]">
                  <tbody>
                    <tr>
                      <td className="px-3 py-1.5" style={{ color: '#5f7184' }}>Subtotal</td>
                      <td className="px-3 py-1.5 text-right font-semibold text-slate-800">{formatGHS(subtotal)}</td>
                    </tr>
                    {tradeIn && (
                      <tr>
                        <td className="px-3 py-1.5 text-green-700">Trade-in Credit</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-green-700">-{formatGHS(tradeIn.value)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-200">
                      <td className="px-3 pt-3 pb-1.5 text-[15px] font-bold text-slate-900">Total</td>
                      <td className="px-3 pt-3 pb-1.5 text-right text-[15px] font-black" style={{ color: '#002d55' }}>{formatGHS(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="rounded-lg p-4 mb-6" style={{ background: '#f8fafc' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5f7184' }}>Notes</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#444' }}>
                  Returns accepted within 7 days with this receipt. Warranty applies to eligible items listed below.
                  {customer && ` · Loyalty points earned: +${Math.round(total * 0.01)} pts`}
                </p>
              </div>

              {/* Warranty certificates */}
              {warrantyItems.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#5f7184' }}>Warranty Certificates</p>
                  <div className="space-y-2">
                    {warrantyItems.map(item => {
                      const wm = warrantyMonths(item.product.type);
                      return (
                        <div key={item.product.id} className="border rounded-lg p-4" style={{ borderColor: '#002d5520' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <i className="ri-shield-star-line text-sm" style={{ color: '#002d55' }} />
                            <p className="text-[13px] font-bold text-slate-800">{item.product.name}</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                            {item.imeiEntered && (
                              <div><span className="block mb-0.5" style={{ color: '#5f7184' }}>IMEI</span><p className="font-semibold font-mono text-slate-800">{item.imeiEntered}</p></div>
                            )}
                            <div><span className="block mb-0.5" style={{ color: '#5f7184' }}>Duration</span><p className="font-semibold text-green-700">{wm} months</p></div>
                            <div><span className="block mb-0.5" style={{ color: '#5f7184' }}>Expires</span><p className="font-semibold text-slate-800">{warrantyExpiry(wm)}</p></div>
                            <div><span className="block mb-0.5" style={{ color: '#5f7184' }}>Receipt</span><p className="font-semibold text-slate-800">{txn}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-[11px]" style={{ color: '#5f7184' }}>Thank you for shopping at Wireless</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#5f7184' }}>hello@fixhub.com · fixhub.com</p>
              </div>

              </div>{/* end z-index wrapper */}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="p-6 border-l border-slate-100 bg-white max-h-[calc(92vh-81px)] overflow-y-auto space-y-4">
            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Status</div>
              <div className="p-4">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  {isPaid ? 'Paid' : 'Recorded'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</div>
              <div className="p-4 space-y-2">
                <button
                  onClick={handlePrint}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer"
                >
                  <i className="ri-printer-line" />Print / Save PDF
                </button>
                <button
                  onClick={onNewSale}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #002d55 0%, #06B6D4 100%)' }}
                >
                  <i className="ri-add-line" />New Sale
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Send Receipt</div>
              <div className="p-4 space-y-2">
                {!customer && (
                  <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                    <i className="ri-information-line" />
                    Attach a customer to enable delivery
                  </p>
                )}
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!customer?.phone}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  style={{
                    background: customer?.phone ? '#25D366' : 'rgba(220,31,31,0.08)',
                    color: customer?.phone ? 'white' : 'rgba(7,16,31,0.3)',
                    cursor: customer?.phone ? 'pointer' : 'not-allowed',
                  }}
                >
                  <i className="ri-whatsapp-line" />
                  Send via WhatsApp
                  {customer?.phone && <span className="text-[11px] opacity-80">· {customer.phone}</span>}
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!customer?.email}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: customer?.email ? '#DC1F1F' : 'rgba(220,31,31,0.08)',
                    color: customer?.email ? 'white' : 'rgba(7,16,31,0.3)',
                    cursor: customer?.email ? 'pointer' : 'not-allowed',
                  }}
                >
                  <i className="ri-mail-send-line" />
                  Send via Email
                  {customer?.email && <span className="text-[11px] opacity-80 truncate max-w-[120px]">· {customer.email}</span>}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Details</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Customer</span><span className="font-semibold text-slate-800">{customer?.name || 'Walk-in'}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Items</span><span className="font-semibold text-slate-800">{cart.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold text-slate-800">{paymentMethod}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Plan</span><span className="font-semibold text-slate-800">{plan}</span></div>
                {tradeIn && <div className="flex items-center justify-between text-emerald-700"><span>Trade-in</span><span className="font-semibold">-{formatGHS(tradeIn.value)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
