import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { FileText, Plus, Search, Download } from 'lucide-react';

const MOCK_INVOICES = [
  { id: 'INV-2026-001', customer: 'Kwame Mensah', amount: 450.00, ticket: 'TK-003', status: 'Paid', date: 'Jun 9, 2026' },
  { id: 'INV-2026-002', customer: 'Akosua Darko', amount: 120.00, ticket: 'TK-004', status: 'Paid', date: 'Jun 8, 2026' },
  { id: 'INV-2026-003', customer: 'Abena Osei', amount: 85.00, ticket: 'TK-002', status: 'Unpaid', date: 'Jun 11, 2026' },
  { id: 'INV-2026-004', customer: 'Fiifi Amo', amount: 320.00, ticket: 'TK-001', status: 'Partial', date: 'Jun 12, 2026' },
  { id: 'INV-2026-005', customer: 'Ama Serwah', amount: 200.00, ticket: 'TK-005', status: 'Overdue', date: 'Jun 1, 2026' },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: 'hsl(var(--status-ready-bg))',       color: 'hsl(var(--status-ready))' },
  Unpaid:  { bg: 'hsl(var(--status-pending-bg))',     color: 'hsl(var(--status-pending))' },
  Partial: { bg: 'hsl(var(--status-in-progress-bg))', color: 'hsl(var(--status-in-progress))' },
  Overdue: { bg: 'hsl(0 70% 14%)', color: 'hsl(0 90% 65%)' },
};

export default function InvoicesPage() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title: 'Invoices', subtitle: 'Track billing and payments' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const total = MOCK_INVOICES.reduce((s, i) => s + i.amount, 0);
  const paid = MOCK_INVOICES.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: `GH₵ ${total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, sub: 'This period' },
          { label: 'Collected', value: `GH₵ ${paid.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, sub: `${MOCK_INVOICES.filter(i => i.status === 'Paid').length} invoices` },
          { label: 'Outstanding', value: `GH₵ ${(total - paid).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, sub: `${MOCK_INVOICES.filter(i => i.status !== 'Paid').length} invoices` },
          { label: 'Overdue', value: `GH₵ ${MOCK_INVOICES.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`, sub: 'Action needed' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border p-4"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{card.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            placeholder="Search invoices..."
            className="h-8 pl-8 pr-3 w-48 rounded-lg text-xs outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
        </div>
        <button
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <Plus className="w-3.5 h-3.5" /> New Invoice
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Invoice', 'Customer', 'Ticket', 'Amount', 'Status', 'Date', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_INVOICES.map((inv, i) => {
              const s = statusStyle[inv.status] ?? statusStyle['Unpaid'];
              return (
                <tr
                  key={inv.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: i < MOCK_INVOICES.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--primary))' }}>{inv.id}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>{inv.customer}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.ticket}</td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    GH₵ {inv.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{inv.date}</td>
                  <td className="px-4 py-3">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
