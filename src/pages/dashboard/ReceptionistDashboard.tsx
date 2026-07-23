import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Wallet, UserPlus, AlertCircle, ChevronRight, Plus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { usePageTitle } from '@/context/PageTitleContext';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';
import type { Invoice, InvoiceStatus } from '@/types/wireless';

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
          <p className="text-[28px] font-bold leading-none" style={{ color: 'hsl(var(--foreground))', letterSpacing: '-0.03em' }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}22` }}>
          <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</p>
    </div>
  );
}

function fmt(n: number) {
  return n >= 1000 ? `GH₵ ${(n / 1000).toFixed(1)}k` : `GH₵ ${n.toFixed(0)}`;
}

const STATUS_META: Record<InvoiceStatus, { label: string; color: string }> = {
  paid:      { label: 'Paid',      color: '#10B981' },
  partial:   { label: 'Partial',   color: '#6366F1' },
  unpaid:    { label: 'Unpaid',    color: '#F59E0B' },
  overdue:   { label: 'Overdue',   color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#64748B' },
};

function InvoiceRow({ inv }: { inv: Invoice }) {
  const meta = STATUS_META[inv.status] ?? STATUS_META.unpaid;
  const time = new Date(inv.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <Link
      to="/invoices"
      className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <div className="w-24 flex-shrink-0">
        <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--primary))' }}>{inv.invoice_number}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
          {inv.customer?.name ?? 'Unknown Customer'}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {fmt(inv.total)}
        </p>
      </div>
      <div className="text-[11px] flex-shrink-0 w-20 text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {time}
      </div>
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: `${meta.color}18`, color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }} />
    </Link>
  );
}

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { invoices, loading: iLoading } = useInvoices();
  const { customers, loading: cLoading } = useWirelessCustomers();

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: false }); }, [setPageTitle]);

  const today = new Date().toISOString().slice(0, 10);

  const newCustomersToday = useMemo(() =>
    customers.filter(c => c.created_at.slice(0, 10) === today),
    [customers, today]);

  const invoicesToday = useMemo(() =>
    invoices.filter(i => i.created_at.slice(0, 10) === today),
    [invoices, today]);

  const collectedToday = useMemo(() =>
    invoices.filter(i => i.status === 'paid' && i.updated_at.slice(0, 10) === today)
      .reduce((s, i) => s + i.amount_paid, 0),
    [invoices, today]);

  const outstanding = useMemo(() =>
    invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled'),
    [invoices]);

  const recentInvoices = useMemo(() =>
    [...invoices].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [invoices]);

  const { paginated: pagedList, page, setPage, totalPages, total } = usePagination(recentInvoices, 8);

  const loading = iLoading || cLoading;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Welcome, {firstName}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Front desk overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Users className="w-3.5 h-3.5" />
            Customers
          </Link>
          <Link
            to="/invoices"
            className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="New Customers Today" value={newCustomersToday.length} sub="Registered today"        icon={UserPlus}   color="#06B6D4" />
        <KPICard label="Invoices Today"      value={invoicesToday.length}     sub="Issued today"             icon={FileText}   color="#8B5CF6" />
        <KPICard label="Collected Today"     value={fmt(collectedToday)}      sub="Paid invoices today"      icon={Wallet}     color="#10B981" />
        <KPICard label="Outstanding"         value={outstanding.length}       sub="Unpaid / partial invoices" icon={AlertCircle} color="#F59E0B" />
      </div>

      {/* Invoice list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Recent Invoices</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Latest activity
            </p>
          </div>
          <Link to="/invoices" className="text-[11px] font-semibold transition-opacity hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>
            All invoices →
          </Link>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-2.5" style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider w-24 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice #</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer / Amount</span>
          <span className="text-[10px] font-bold uppercase tracking-wider w-20 text-right flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Time</span>
          <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</span>
          <span className="w-3.5 flex-shrink-0" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FileText className="w-8 h-8 opacity-20" style={{ color: 'hsl(var(--foreground))' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>No invoices yet</p>
            <Link to="/invoices" className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              Create the first invoice →
            </Link>
          </div>
        ) : (
          <>
            {pagedList.map(inv => <InvoiceRow key={inv.id} inv={inv} />)}
            <div className="px-5 pb-4">
              <Pagination page={page} pageCount={totalPages} total={total} pageSize={8} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
