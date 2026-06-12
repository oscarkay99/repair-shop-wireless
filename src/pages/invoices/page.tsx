import { useEffect, useState } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useInvoices } from '@/hooks/useInvoices';
import { FileText, Plus, Search, Download } from 'lucide-react';
import type { InvoiceStatus } from '@/types/wireless';

const STATUS_STYLE: Record<InvoiceStatus, { bg: string; color: string }> = {
  paid:      { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  unpaid:    { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))' },
  partial:   { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  overdue:   { bg: 'hsl(0 70% 14%)', color: 'hsl(0 90% 65%)' },
  cancelled: { bg: 'hsl(0 0% 10%)', color: 'hsl(0 0% 45%)' },
};

function fmt(n: number) {
  return `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const { setPageTitle } = usePageTitle();
  const { invoices, loading, totals } = useInvoices();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPageTitle({ title: 'Invoices', subtitle: 'Track billing and payments' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const filtered = invoices.filter(inv => {
    const q = query.toLowerCase();
    return !q || inv.invoice_number.toLowerCase().includes(q)
      || (inv.customer?.name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: fmt(totals.total), sub: `${invoices.length} invoices` },
          { label: 'Collected',      value: fmt(totals.collected), sub: `${invoices.filter(i => i.status === 'paid').length} paid` },
          { label: 'Outstanding',    value: fmt(totals.outstanding), sub: `${invoices.filter(i => !['paid','cancelled'].includes(i.status)).length} open` },
          { label: 'Overdue',        value: fmt(totals.overdue), sub: 'Action needed' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{c.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search invoices..."
            className="h-8 pl-8 pr-3 w-48 rounded-lg text-xs outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>
        <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No invoices found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Invoice', 'Customer', 'Ticket', 'Amount', 'Paid', 'Status', 'Due Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.unpaid;
                const customerName = inv.customer?.name ?? '—';
                return (
                  <tr key={inv.id} className="transition-colors cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{inv.invoice_number}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{customerName}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.ticket?.ticket_number ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(inv.total)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt(inv.amount_paid)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg" title="Download PDF"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
