import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Users, BarChart3, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRepairs } from '@/hooks/useRepairs';
import { useInvoices } from '@/hooks/useInvoices';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { usePageTitle } from '@/context/PageTitleContext';
import { isActiveRepairStatus } from '@/utils/repairStatus';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string;
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
  return n >= 1000 ? `GH₵ ${(n / 1000).toFixed(1)}k` : `GH₵ ${n}`;
}

export default function SalesManagerDashboard() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { repairs, loading: rLoading } = useRepairs();

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: true }); }, [setPageTitle]);
  const { invoices, loading: iLoading } = useInvoices();
  const { sales, loading: sLoading } = useAccessoryStore();

  const today     = new Date().toISOString().slice(0, 10);
  const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const startWeek  = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const isDone = (status: string) => status === 'completed' || status === 'diagnosis_only_closed';

  // Completed repairs this month (for the "Completed Repairs" list — job count/value, not revenue)
  const completedThisMonth = useMemo(() =>
    repairs.filter(r => isDone(r.status) && r.completedDate?.slice(0, 10) >= startMonth),
    [repairs, startMonth]);

  // Revenue (Option B): invoices are the canonical "money received" ledger —
  // amount_paid on paid invoices, not ticket/accessory-sale totals directly, to
  // avoid double-counting the same job/sale across both its record and its invoice.
  const totalRevenueMonth = useMemo(() =>
    invoices.filter(i => i.status === 'paid' && i.updated_at.slice(0, 10) >= startMonth)
      .reduce((s, i) => s + i.amount_paid, 0),
    [invoices, startMonth]);

  // Accessory sales (real data — units/activity, not counted again as revenue above)
  const salesThisMonth = useMemo(() =>
    sales.filter(s => s.sold_at.slice(0, 10) >= startMonth),
    [sales, startMonth]);

  // Active pipeline
  const activePipeline = useMemo(() =>
    repairs.filter(r => isActiveRepairStatus(r.status)),
    [repairs]);

  // Sales today
  const salesToday = useMemo(() =>
    sales.filter(s => s.sold_at.slice(0, 10) === today),
    [sales, today]);

  // Customers with repairs this month
  const uniqueCustomers = useMemo(() => {
    const ids = new Set(
      repairs
        .filter(r => (r.createdAt ?? r.started)?.slice(0, 10) >= startMonth)
        .map(r => r.customerId ?? r.customer)
    );
    return ids.size;
  }, [repairs, startMonth]);

  // Recent completed
  const recentCompleted = useMemo(() =>
    [...repairs].filter(r => isDone(r.status))
      .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? '')),
    [repairs]);

  const { paginated: pagedCompleted, page: completedPage, setPage: setCompletedPage, totalPages: completedTotalPages, total: completedTotal } = usePagination(recentCompleted, 6);
  const { paginated: pagedSales, page: salesPage, setPage: setSalesPage, totalPages: salesTotalPages, total: salesTotal } = usePagination(salesThisMonth, 6);

  const loading = rLoading || sLoading || iLoading;
  const firstName = user?.name?.split(' ')[0] ?? 'Manager';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Good work, {firstName}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Sales & revenue overview for this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/sales" className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Accessories
          </Link>
          <Link to="/tickets" className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}>
            <BarChart3 className="w-3.5 h-3.5" />
            Repairs
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue (Month)"
          value={fmt(totalRevenueMonth)}
          sub={`From paid invoices`}
          icon={TrendingUp}
          color="#10B981"
        />
        <KPICard
          label="Accessory Sales Today"
          value={String(salesToday.length)}
          sub={`GH₵ ${salesToday.reduce((s, x) => s + x.total, 0).toLocaleString()}`}
          icon={ShoppingBag}
          color="#F59E0B"
        />
        <KPICard
          label="Active Pipeline"
          value={String(activePipeline.length)}
          sub="Repairs in progress"
          icon={BarChart3}
          color="#06B6D4"
        />
        <KPICard
          label="Customers (Month)"
          value={String(uniqueCustomers)}
          sub="Unique customers served"
          icon={Users}
          color="#8B5CF6"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent completed repairs */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Completed Repairs</p>
            <Link to="/tickets" className="text-[11px] font-semibold hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
            </div>
          ) : recentCompleted.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No completed repairs yet</p>
            </div>
          ) : (
            <>
              {pagedCompleted.map(r => (
                <Link key={r.id} to="/tickets"
                  className="flex items-center gap-3 px-5 py-3 transition-colors group"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      {r.customer || '—'} — {r.device}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {r.id} · {r.completedDate ? new Date(r.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <p className="text-xs font-bold flex-shrink-0" style={{ color: '#10B981' }}>
                    {r.costNum ? `GH₵ ${r.costNum.toLocaleString()}` : '—'}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40" style={{ color: 'hsl(var(--foreground))' }} />
                </Link>
              ))}
              <div className="px-5 pb-3">
                <Pagination page={completedPage} pageCount={completedTotalPages} total={completedTotal} pageSize={6} onPageChange={setCompletedPage} />
              </div>
            </>
          )}
        </div>

        {/* Recent sales */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Accessory Sales</p>
            <Link to="/sales" className="text-[11px] font-semibold hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>View all →</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
            </div>
          ) : salesThisMonth.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales this month</p>
            </div>
          ) : (
            <>
              {pagedSales.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{s.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.product_name} × {s.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>GH₵ {s.total.toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.payment_method}</p>
                  </div>
                </div>
              ))}
              <div className="px-5 pb-3">
                <Pagination page={salesPage} pageCount={salesTotalPages} total={salesTotal} pageSize={6} onPageChange={setSalesPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
