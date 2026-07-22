import { useTransactions } from '@/hooks/useTransactions';
import { useInvoices } from '@/hooks/useInvoices';

function parseAmt(a: string) {
  return parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
}

function fmtGHS(n: number) {
  return `GHS ${Math.round(n).toLocaleString()}`;
}

export default function PaymentStats() {
  const { transactions } = useTransactions();
  const { invoices, totals: invoiceTotals } = useInvoices();

  const outstandingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.total - i.amount_paid > 0);

  const verified   = transactions.filter(t => t.status === 'verified');
  const pending    = transactions.filter(t => t.status === 'pending' || t.status === 'needs_review');
  const needsReview = transactions.filter(t => t.status === 'needs_review');

  const totalCollected   = verified.reduce((s, t) => s + parseAmt(t.amount), 0);
  const pendingTotal     = pending.reduce((s, t) => s + parseAmt(t.amount), 0);

  const momoTotal = verified.filter(t => t.method === 'MoMo').reduce((s, t) => s + parseAmt(t.amount), 0);
  const bankTotal = verified.filter(t => t.method === 'Bank Transfer').reduce((s, t) => s + parseAmt(t.amount), 0);
  const cashTotal = verified.filter(t => t.method === 'Cash').reduce((s, t) => s + parseAmt(t.amount), 0);
  const cardTotal = verified.filter(t => t.method === 'Card').reduce((s, t) => s + parseAmt(t.amount), 0);
  const maxBreakdown = Math.max(momoTotal, bankTotal, cashTotal, cardTotal, 1);

  const breakdown = [
    { label: 'MoMo',          value: fmtGHS(momoTotal), pct: `${Math.round((momoTotal / maxBreakdown) * 100)}%` },
    { label: 'Bank Transfer', value: fmtGHS(bankTotal), pct: `${Math.round((bankTotal / maxBreakdown) * 100)}%` },
    { label: 'Cash',          value: fmtGHS(cashTotal), pct: `${Math.round((cashTotal / maxBreakdown) * 100)}%` },
    { label: 'Card',          value: fmtGHS(cardTotal), pct: `${Math.round((cardTotal / maxBreakdown) * 100)}%` },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{fmtGHS(totalCollected)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{verified.length} verified transactions</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-600">{fmtGHS(pendingTotal)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{pending.length} transactions</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-500">{fmtGHS(invoiceTotals.outstanding)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Reconciliation Queue</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{needsReview.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">items to review</p>
        </div>
      </div>

      {/* Method breakdown */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))]">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">Collected by Payment Method</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {breakdown.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.label}</p>
              <p className="text-sm font-bold text-[hsl(var(--foreground))]">{m.value}</p>
              <div className="mt-1.5 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: m.pct }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
