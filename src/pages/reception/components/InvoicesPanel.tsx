import { useMemo, useState, useEffect } from 'react';
import { FileText, CreditCard, AlertCircle, Search, Eye, Share2, Printer, Check, Plus, X } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/utils/date';
import Pagination from '@/components/shared/Pagination';
import type { Invoice, InvoiceStatus } from '@/types/wireless';
import type { PaymentMethod } from '@/types/sale';

interface SplitRow { method: PaymentMethod; amount: string }

type FilterKey = 'all' | 'unpaid' | 'partial' | 'paid' | 'overdue';
const PAGE_SIZE = 10;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'unpaid',  label: 'Unpaid' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid',    label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

const STATUS_META: Record<InvoiceStatus, { label: string; bg: string; color: string }> = {
  paid:      { label: 'Paid',      bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  unpaid:    { label: 'Unpaid',    bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  partial:   { label: 'Partial',   bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  overdue:   { label: 'Overdue',   bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  cancelled: { label: 'Cancelled', bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
};

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'MoMo', 'Bank Transfer'];

export default function InvoicesPanel() {
  const { invoices, loading, totals, markPaid } = useInvoices();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [page, setPage] = useState(1);

  const unpaidCount = useMemo(() => invoices.filter(i => i.status === 'unpaid').length, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter(i => filter === 'all' || i.status === filter)
      .filter(i => !q || i.invoice_number.toLowerCase().includes(q) || (i.customer?.name ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [invoices, filter, search]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const pagedInvoices = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const handleShare = async (invoiceNumber: string, total: number, customer?: string) => {
    const text = `Invoice ${invoiceNumber}${customer ? ` for ${customer}` : ''} — GH₵ ${total.toFixed(2)}`;
    if (navigator.share) {
      try { await navigator.share({ title: invoiceNumber, text }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(text); showToast('Copied invoice details'); }
    catch { showToast(text); }
  };

  const startMarkingPaid = (inv: Invoice) => {
    setMarkingPaidId(inv.id);
    setSplits([{ method: 'Cash', amount: (inv.total - inv.amount_paid).toFixed(2) }]);
  };

  const cancelMarkingPaid = () => {
    setMarkingPaidId(null);
    setSplits([]);
  };

  const splitTotal = splits.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const addSplit = (outstanding: number) => {
    const remaining = Math.max(0, outstanding - splitTotal);
    setSplits(rows => [...rows, { method: 'Cash', amount: remaining > 0 ? remaining.toFixed(2) : '' }]);
  };

  const removeSplit = (index: number) => setSplits(rows => rows.filter((_, i) => i !== index));

  const updateSplit = (index: number, patch: Partial<SplitRow>) =>
    setSplits(rows => rows.map((r, i) => i === index ? { ...r, ...patch } : r));

  const confirmPayment = async (inv: Invoice) => {
    for (const row of splits) {
      const amount = parseFloat(row.amount) || 0;
      if (amount <= 0) continue;
      await markPaid(inv.id, amount, row.method, inv.customer?.name);
    }
    showToast('Payment recorded');
    cancelMarkingPaid();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
            <FileText className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{invoices.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <CreditCard className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{unpaidCount}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>Unpaid</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {totals.outstanding.toFixed(2)}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>Outstanding</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice # or customer..."
            className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="h-8 px-3.5 rounded-full text-xs font-semibold transition-colors"
              style={filter === f.key
                ? { background: 'hsl(var(--primary))', color: 'white' }
                : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{filtered.length} Invoices</p>
        <div className="space-y-2">
          {loading ? (
            <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No invoices match.</p>
          ) : pagedInvoices.map(inv => {
            const s = STATUS_META[inv.status];
            const outstanding = inv.total - inv.amount_paid;
            const expanded = expandedId === inv.id;
            const markingPaid = markingPaidId === inv.id;
            return (
              <div key={inv.id} className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{inv.invoice_number}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      {inv.payment_method && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{inv.payment_method}</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.customer?.name ?? 'Unknown customer'}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatDate(inv.created_at)}</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {inv.total.toFixed(2)}</p>
                </div>

                {expanded && (
                  <div className="mt-3 pt-3 grid grid-cols-2 gap-2 text-xs" style={{ borderTop: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    <span>Subtotal: GH₵ {inv.subtotal.toFixed(2)}</span>
                    <span>Tax: GH₵ {inv.tax.toFixed(2)}</span>
                    <span>Discount: GH₵ {inv.discount.toFixed(2)}</span>
                    <span>Paid: GH₵ {inv.amount_paid.toFixed(2)}</span>
                    {inv.due_date && <span>Due: {formatDate(inv.due_date)}</span>}
                    {inv.notes && <span className="col-span-2">Notes: {inv.notes}</span>}
                  </div>
                )}

                {markingPaid ? (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    {splits.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={row.method}
                          onChange={e => updateSplit(idx, { method: e.target.value as PaymentMethod })}
                          className="h-8 px-2 rounded-lg text-xs outline-none flex-shrink-0"
                          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>GH₵</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={row.amount}
                            onChange={e => updateSplit(idx, { amount: e.target.value })}
                            className="w-full h-8 pl-9 pr-2 rounded-lg text-xs outline-none"
                            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          />
                        </div>
                        {splits.length > 1 && (
                          <button onClick={() => removeSplit(idx)} className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 cursor-pointer" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center justify-between">
                      <button onClick={() => addSplit(outstanding)} className="flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: 'hsl(var(--primary))' }}>
                        <Plus className="w-3.5 h-3.5" /> Split Payment
                      </button>
                      <span className="text-xs font-semibold" style={{ color: splitTotal > outstanding + 0.001 ? '#ef4444' : 'hsl(var(--muted-foreground))' }}>
                        GH₵{splitTotal.toFixed(2)} / GH₵{outstanding.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => confirmPayment(inv)}
                        disabled={splitTotal <= 0 || splitTotal > outstanding + 0.001}
                        className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'hsl(var(--primary))' }}
                      >
                        Confirm Payment
                      </button>
                      <button onClick={cancelMarkingPaid} className="text-xs cursor-pointer" style={{ color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <button onClick={() => setExpandedId(expanded ? null : inv.id)} className="flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: 'hsl(var(--primary))' }}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => handleShare(inv.invoice_number, inv.total, inv.customer?.name)} className="flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: 'hsl(var(--foreground))' }}>
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: 'hsl(var(--foreground))' }}>
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    {(inv.status === 'unpaid' || inv.status === 'partial' || inv.status === 'overdue') && (
                      <button onClick={() => startMarkingPaid(inv)} className="flex items-center gap-1 text-xs font-semibold cursor-pointer" style={{ color: '#22c55e' }}>
                        <Check className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Pagination
            page={page}
            pageCount={Math.ceil(filtered.length / PAGE_SIZE)}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
