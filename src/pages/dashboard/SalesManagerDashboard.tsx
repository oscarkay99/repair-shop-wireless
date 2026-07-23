import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { usePageTitle } from '@/context/PageTitleContext';
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

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: true }); }, [setPageTitle]);
  const { invoices, loading: iLoading } = useInvoices();
  const { sales, loading: sLoading } = useAccessoryStore();

  const today     = new Date().toISOString().slice(0, 10);
  const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  // Revenue = paid invoices (amount_paid) + accessory sales. Accessory sales are
  // recorded straight to accessory_sales and never become an invoice, so they
  // have to be added in explicitly — there's no double-counting risk here, since
  // nothing else was counting them as revenue before this.
  const salesThisMonth = useMemo(() =>
    sales.filter(s => s.sold_at.slice(0, 10) >= startMonth),
    [sales, startMonth]);

  const totalRevenueMonth = useMemo(() => {
    const invoiceRevenue = invoices
      .filter(i => i.status === 'paid' && i.updated_at.slice(0, 10) >= startMonth)
      .reduce((s, i) => s + i.amount_paid, 0);
    const accessoryRevenue = salesThisMonth.reduce((s, sale) => s + sale.total, 0);
    return invoiceRevenue + accessoryRevenue;
  }, [invoices, salesThisMonth, startMonth]);

  // Sales today
  const salesToday = useMemo(() =>
    sales.filter(s => s.sold_at.slice(0, 10) === today),
    [sales, today]);

  // Unique customers across invoices and accessory sales (all-time)
  const uniqueCustomers = useMemo(() => {
    const ids = new Set<string>();
    invoices.forEach(i => { if (i.customer_id) ids.add(i.customer_id); });
    sales.forEach(s => { if (s.customer_id) ids.add(s.customer_id); });
    return ids.size;
  }, [invoices, sales]);

  const { paginated: pagedSales, page: salesPage, setPage: setSalesPage, totalPages: salesTotalPages, total: salesTotal } = usePagination(salesThisMonth, 6);

  const loading = sLoading || iLoading;
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
          <Link to="/sales" className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}>
            <ShoppingBag className="w-3.5 h-3.5" />
            Accessories
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Revenue (Month)"
          value={fmt(totalRevenueMonth)}
          sub="Paid invoices + accessory sales"
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
          label="Customers"
          value={String(uniqueCustomers)}
          sub="Unique customers served"
          icon={Users}
          color="#8B5CF6"
        />
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
  );
}
