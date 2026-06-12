import { useRef } from 'react';
import type { Repair } from '@/types/repair';

interface Props {
  repair: Repair;
  onClose: () => void;
}

function formatGHS(n: number) {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function receiptNumber(id: string) {
  return `FH-${id.replace('R-', '')}`;
}

function WirelessLogoSVG({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#DC1F1F" />
      <path d="M12 28 L16 16 L20 22 L24 16 L28 28" stroke="#DC1F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="20" cy="13" r="3" fill="#DC1F1F" />
    </svg>
  );
}

export default function RepairReceiptModal({ repair, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const txn = receiptNumber(repair.id);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
  const costNum = repair.costNum ?? (parseFloat(repair.cost.replace(/[^0-9.]/g, '')) || 0);
  const isReady = repair.status === 'ready' || repair.status === 'completed';

  function buildWhatsAppText() {
    const lines = [
      `*Wireless Repair ${isReady ? 'Receipt' : 'Job Card'} — ${txn}*`,
      '',
      `Customer: ${repair.customer}`,
      `Device: ${repair.device}`,
      `Issue: ${repair.issue}`,
      `Technician: ${repair.technician}`,
      `Date: ${dateStr}`,
      '',
      repair.parts.length > 0 ? `*Parts used:*\n${repair.parts.map(p => `• ${p.name}`).join('\n')}` : '',
      '',
      `*Total: ${repair.cost}*`,
      '',
      repair.warranty ? '✅ This repair is covered under warranty.' : '',
      '',
      'Thank you for choosing Wireless!',
      'fixhub.com',
    ].filter(l => l !== undefined);
    return lines.join('\n');
  }

  function handleSendWhatsApp(phone?: string) {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    const formatted = digits.startsWith('0') ? `233${digits.slice(1)}` : digits;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(buildWhatsAppText())}`, '_blank');
  }

  function handleSendEmail(email?: string) {
    if (!email) return;
    const subject = encodeURIComponent(`Wireless Repair ${isReady ? 'Receipt' : 'Job Card'} — ${txn}`);
    const body = encodeURIComponent(buildWhatsAppText().replace(/\*/g, ''));
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  }

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=780,height=900');
    if (!win) return;
    win.document.write(`
      <html><head><title>Wireless ${isReady ? 'Receipt' : 'Job Card'} ${txn}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1e1e1e; background:#fff; padding:32px; max-width:740px; margin:0 auto; }
        .rcp-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
        .rcp-logo-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
        .rcp-logo-text { font-size:22px; font-weight:900; color:#DC1F1F; letter-spacing:-0.02em; }
        .rcp-logo-text span { color:#DC1F1F; }
        .rcp-company-address { font-size:11px; color:#5f7184; line-height:1.6; }
        .rcp-title-block { text-align:right; }
        .rcp-ready-stamp { display:inline-block; border:3px solid #16a34a; color:#16a34a; font-size:13px; font-weight:800; padding:4px 12px; border-radius:4px; transform:rotate(-8deg); margin-bottom:8px; letter-spacing:.08em; }
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
        .rcp-total-row { background:#eff6ff; }
        .rcp-total-label { font-weight:700; color:#1e1e1e; }
        .rcp-total-value { font-weight:800; color:#DC1F1F; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        thead tr { background:#DC1F1F; color:#fff; }
        thead th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
        tbody tr { border-bottom:1px solid #f0f0f0; }
        tbody tr:nth-child(even) { background:#fafafa; }
        tbody td { padding:10px 12px; font-size:12px; color:#1e1e1e; }
        .rcp-note-block { margin-top:16px; padding:12px; background:#f8fafc; border-radius:6px; }
        .rcp-note-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#5f7184; margin-bottom:5px; }
        .rcp-note-text { font-size:11px; color:#444; line-height:1.6; }
        .warranty-block { border:1px solid #DC1F1F20; border-radius:6px; padding:12px 16px; margin-top:16px; }
        .warranty-title { font-size:11px; font-weight:700; color:#DC1F1F; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; }
        .warranty-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; font-size:11px; }
        .warranty-key { color:#5f7184; margin-bottom:2px; }
        .warranty-val { font-weight:600; color:#1e1e1e; }
        .footer { margin-top:24px; text-align:center; font-size:11px; color:#5f7184; border-top:1px solid #e0e0e0; padding-top:14px; }
        @media print { body { padding:16px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-emerald-600 text-xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{isReady ? 'Repair Complete' : 'Repair Job Card'}</p>
              <p className="text-[10px] text-slate-400">{txn} · {repair.device}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer">
            <i className="ri-close-line text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr]">

          {/* Receipt preview */}
          <div className="p-6 bg-[#f0f4f8] max-h-[calc(92vh-81px)] overflow-y-auto">
            <div ref={receiptRef} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">

              {/* Watermark */}
              <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 0, opacity: 0.04 }}>
                <svg width="320" height="320" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="10" fill="#DC1F1F" />
                  <path d="M12 28 L16 16 L20 22 L24 16 L28 28" stroke="#DC1F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="20" cy="13" r="3" fill="#DC1F1F" />
                </svg>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Top: branding + title */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-5">
                  <div>
                    <div className="rcp-logo-row flex items-center gap-2.5 mb-1">
                      <WirelessLogoSVG size={38} />
                      <span className="text-[22px] font-black tracking-tight text-[#DC1F1F]" style={{ letterSpacing: '-0.02em' }}>
                        Fix<span style={{ color: '#DC1F1F' }}>Hub</span>
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#5f7184]">
                      Accra, Ghana<br />
                      repairs@fixhub.com · fixhub.com
                    </p>
                  </div>
                  <div className="sm:text-right">
                    {isReady && (
                      <div className="inline-block border-2 border-green-600 text-green-600 text-[11px] font-black px-3 py-1 rounded mb-2 tracking-widest uppercase" style={{ transform: 'rotate(-8deg)' }}>
                        READY
                      </div>
                    )}
                    <p className="text-[26px] font-black text-slate-900 leading-none">{isReady ? 'RECEIPT' : 'JOB CARD'}</p>
                    <p className="text-[11px] mt-1 text-[#5f7184]"># {txn}</p>
                  </div>
                </div>

                <hr className="border-slate-200 mb-5" />

                {/* Middle: Bill To + meta table */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#5f7184]">Customer</p>
                    <p className="text-[14px] font-bold text-slate-900">{repair.customer}</p>
                    <p className="text-[12px] mt-1 text-[#5f7184]">{repair.device}</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden min-w-[260px]">
                    {[
                      { label: 'Job Reference', value: txn },
                      { label: 'Date',          value: `${dateStr} · ${timeStr}` },
                      { label: 'Technician',    value: repair.technician || '—' },
                      { label: 'ETA',           value: repair.eta || '—' },
                      { label: 'Warranty',      value: repair.warranty ? 'Covered' : 'No' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between px-3.5 py-2 border-b border-slate-100 last:border-0 text-[12px]">
                        <span className="text-[#5f7184]">{row.label}</span>
                        <span className={`font-semibold ${row.label === 'Warranty' && repair.warranty ? 'text-emerald-600' : 'text-slate-800'}`}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-3.5 py-2.5 text-[12px]" style={{ background: '#eff6ff' }}>
                      <span className="font-bold text-slate-800">Total</span>
                      <span className="font-black text-[#DC1F1F]">{costNum > 0 ? formatGHS(costNum) : repair.cost}</span>
                    </div>
                  </div>
                </div>

                {/* Repair details */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: '#DC1F1F' }}>
                        {['Description', 'Device', 'Status', 'Amount'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-3 text-[13px] font-semibold text-slate-800">{repair.issue}</td>
                        <td className="px-3 py-3 text-[12px] text-slate-600">{repair.device}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'}`}>
                            {repair.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[13px] font-bold text-slate-800">
                          {costNum > 0 ? formatGHS(costNum) : repair.cost}
                        </td>
                      </tr>
                      {repair.parts.map((part, i) => (
                        <tr key={i} className="border-b border-slate-50" style={{ background: '#fafafa' }}>
                          <td className="px-3 py-2.5 text-[12px] text-slate-600 pl-6">↳ {part.name}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-400">Part</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              part.status === 'installed' ? 'bg-emerald-100 text-emerald-700' :
                              part.status === 'ordered'   ? 'bg-cyan-100 text-cyan-700' :
                                                            'bg-amber-100 text-amber-700'
                            }`}>{part.status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-400">Included</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Technician notes */}
                {repair.notes.length > 0 && (
                  <div className="rounded-lg p-4 mb-6" style={{ background: '#f8fafc' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#5f7184]">Technician Notes</p>
                    {repair.notes.map((note, i) => (
                      <p key={i} className="text-[11px] leading-relaxed text-[#444]">• {note}</p>
                    ))}
                  </div>
                )}

                {/* Warranty block */}
                {repair.warranty && (
                  <div className="border rounded-lg p-4 mb-6" style={{ borderColor: '#DC1F1F20' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ri-shield-star-line text-sm text-[#DC1F1F]" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#DC1F1F]">Warranty Certificate</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-[11px]">
                      <div><span className="block mb-0.5 text-[#5f7184]">Device</span><p className="font-semibold text-slate-800">{repair.device}</p></div>
                      <div><span className="block mb-0.5 text-[#5f7184]">Duration</span><p className="font-semibold text-emerald-700">90 days</p></div>
                      <div><span className="block mb-0.5 text-[#5f7184]">Reference</span><p className="font-semibold text-slate-800">{txn}</p></div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-slate-200 pt-4 text-center">
                  <p className="text-[11px] text-[#5f7184]">Thank you for choosing Wireless</p>
                  <p className="text-[11px] mt-0.5 text-[#5f7184]">repairs@fixhub.com · fixhub.com</p>
                </div>

              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="p-6 border-l border-slate-100 bg-white max-h-[calc(92vh-81px)] overflow-y-auto space-y-4">

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Status</div>
              <div className="p-4">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  isReady
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-100'
                }`}>
                  {repair.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</div>
              <div className="p-4 space-y-2">
                <button
                  onClick={handlePrint}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <i className="ri-printer-line" /> Print / Save PDF
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #DC1F1F 0%, #2463BE 100%)' }}
                >
                  <i className="ri-close-line" /> Close
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Send to Customer</div>
              <div className="p-4 space-y-2">
                <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                  <i className="ri-information-line" />
                  Customer contact needed to send
                </p>
                <button
                  onClick={() => handleSendWhatsApp()}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-40"
                  style={{ background: '#25D366', color: 'white' }}
                  title="Add customer phone number to enable"
                >
                  <i className="ri-whatsapp-line" /> Send via WhatsApp
                </button>
                <button
                  onClick={() => handleSendEmail()}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-40"
                  style={{ background: '#DC1F1F', color: 'white' }}
                  title="Add customer email to enable"
                >
                  <i className="ri-mail-send-line" /> Send via Email
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">Job Details</div>
              <div className="p-4 space-y-3 text-sm">
                {[
                  { label: 'Customer',    value: repair.customer },
                  { label: 'Device',      value: repair.device },
                  { label: 'Technician',  value: repair.technician || '—' },
                  { label: 'Started',     value: repair.started },
                  { label: 'Parts',       value: `${repair.parts.length} item${repair.parts.length !== 1 ? 's' : ''}` },
                  { label: 'Total',       value: costNum > 0 ? formatGHS(costNum) : repair.cost },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
