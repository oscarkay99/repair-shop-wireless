import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/feature/AdminLayout';
import { useSales } from '@/hooks/useSales';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import type { SaleStatus } from '@/types/sale';

const statusConfig: Record<string, { label: string; color: string }> = {
  completed:       { label: 'Completed',      color: 'bg-emerald-100 text-emerald-700' },
  pending_payment: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700' },
  packing:         { label: 'Packing',         color: 'bg-cyan-100 text-cyan-700' },
  cancelled:       { label: 'Voided',          color: 'bg-slate-100 text-slate-400' },
  refunded:        { label: 'Refunded',        color: 'bg-rose-100 text-rose-500' },
};

const methodIcons: Record<string, string> = {
  MoMo: 'ri-smartphone-line',
  'Bank Transfer': 'ri-bank-line',
  Cash: 'ri-money-dollar-circle-line',
  Card: 'ri-bank-card-line',
};

const VOIDABLE: SaleStatus[] = ['completed', 'pending_payment', 'packing'];

function parseTotal(t: string) {
  return parseFloat(t.replace(/[^0-9.]/g, '')) || 0;
}

function ActionMenu({ onVoid, onRefund }: { onVoid: () => void; onRefund: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
      >
        <i className="ri-more-2-fill text-sm" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onVoid(); }}
            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-close-circle-line text-slate-400" />
            Void Sale
          </button>
          <button
            onClick={() => { setOpen(false); onRefund(); }}
            className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-arrow-go-back-line text-rose-400" />
            Mark as Refunded
          </button>
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  const { sales, voidSale } = useSales();
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'cancelled' | 'refunded'>('cancelled');

  const activeSales = sales.filter(s => s.status !== 'cancelled' && s.status !== 'refunded');
  const totalRevenue = activeSales.reduce((sum, s) => sum + parseTotal(s.total), 0);
  const completedSales = sales.filter(s => s.status === 'completed');
  const voidedCount = sales.filter(s => s.status === 'cancelled' || s.status === 'refunded').length;
  const avgOrder = completedSales.length ? Math.round(totalRevenue / completedSales.length) : 0;

  const { paginated, page, setPage, totalPages, total, from, to } = usePagination(sales, 20);

  const stats = [
    { label: 'Revenue (Active)',  value: `GHS ${Math.round(totalRevenue).toLocaleString()}`, icon: 'ri-shopping-bag-3-line', accent: 'bg-emerald-500' },
    { label: 'Total Orders',      value: String(sales.length),                               icon: 'ri-file-list-3-line',    accent: 'bg-[#DC1F1F]' },
    { label: 'Completed',         value: String(completedSales.length),                      icon: 'ri-check-double-line',   accent: 'bg-emerald-500' },
    { label: 'Voided / Refunded', value: String(voidedCount),                                icon: 'ri-close-circle-line',   accent: 'bg-rose-400' },
  ];

  function handleConfirm() {
    if (!confirmId) return;
    void voidSale(confirmId, confirmAction);
    setConfirmId(null);
  }

  return (
    <AdminLayout title="Sales" subtitle="Track orders and transactions">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <i className={`${s.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">All Sales</h3>
              <span className="text-xs text-slate-400">{sales.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Order', 'Customer', 'Items', 'Total', 'Method', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-400">
                        <i className="ri-shopping-bag-3-line text-3xl block mb-2 text-slate-200" />
                        No sales yet. Use the POS to record your first sale.
                      </td>
                    </tr>
                  )}
                  {paginated.map((s, i) => {
                    const cfg = statusConfig[s.status] ?? { label: s.status, color: 'bg-slate-100 text-slate-500' };
                    const isVoided = s.status === 'cancelled' || s.status === 'refunded';
                    const isConfirming = confirmId === s.id;

                    if (isConfirming) {
                      return (
                        <tr key={s.id} className="border-b border-slate-50 bg-rose-50">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-100 flex-shrink-0">
                                <i className="ri-alert-line text-rose-500 text-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-rose-700">
                                  {confirmAction === 'cancelled' ? 'Void this sale?' : 'Mark as refunded?'}
                                </p>
                                <p className="text-xs text-rose-400 mt-0.5">
                                  {confirmAction === 'cancelled'
                                    ? 'It will be excluded from revenue. This cannot be undone.'
                                    : 'This marks the sale as refunded and removes it from active revenue.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => setConfirmId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleConfirm}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 cursor-pointer"
                                >
                                  {confirmAction === 'cancelled' ? 'Void Sale' : 'Mark Refunded'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${isVoided ? 'opacity-50' : ''} ${i % 2 === 0 ? '' : 'bg-slate-50/20'}`}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.id}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800">{s.customer}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate">{s.items}</td>
                        <td className={`px-4 py-3 text-xs font-bold ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{s.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <i className={`${methodIcons[s.method] ?? 'ri-money-dollar-circle-line'} text-xs text-slate-400`} />
                            <span className="text-xs text-slate-600">{s.method}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{s.date}</td>
                        <td className="px-4 py-3">
                          {!isVoided && VOIDABLE.includes(s.status) && (
                            <ActionMenu
                              onVoid={() => { setConfirmAction('cancelled'); setConfirmId(s.id); }}
                              onRefund={() => { setConfirmAction('refunded'); setConfirmId(s.id); }}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} from={from} to={to} onPageChange={setPage} />
          </div>
        </div>

        {/* POS CTA */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center gap-4 sticky top-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DC1F1F 0%, #B81616 100%)' }}>
              <i className="ri-store-3-line text-white text-2xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Ready to make a sale?</p>
              <p className="text-xs text-slate-400 mt-1">Use the POS to scan products, select a customer, and process payment.</p>
            </div>
            <button
              onClick={() => navigate('/pos')}
              className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #DC1F1F 0%, #B81616 100%)' }}
            >
              <i className="ri-shopping-cart-2-line" />
              Open POS
            </button>
            <div className="w-full pt-3 border-t border-slate-100 text-left space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Void / Refund</p>
              <div className="flex items-start gap-2">
                <i className="ri-more-2-fill text-slate-300 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400">Click the <strong className="text-slate-500">⋯</strong> button on any active sale row to void it or mark it as refunded. Voided sales are removed from all revenue figures.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
