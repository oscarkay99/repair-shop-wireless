import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, XCircle, DollarSign, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
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

export default function InventoryManagerDashboard() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { products, loading } = useInventory();

  useEffect(() => { setPageTitle({ title: 'Dashboard', hideDefaultAction: true }); }, [setPageTitle]);

  const LOW_STOCK_THRESHOLD = 5;

  const totalItems     = products.length;
  const lowStock       = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD), [products]);
  const outOfStock     = useMemo(() => products.filter(p => p.stock === 0), [products]);
  const totalValue     = useMemo(() =>
    products.reduce((sum, p) => sum + (parseFloat(p.price.replace(/[^0-9.]/g, '') || '0') * p.stock), 0),
    [products]);

  const fastMovers     = useMemo(() => products.filter(p => p.fastMover), [products]);

  const urgentItems = useMemo(() =>
    [...outOfStock, ...lowStock]
      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i),
    [outOfStock, lowStock]);

  const { paginated: pagedUrgent, page: urgentPage, setPage: setUrgentPage, totalPages: urgentTotalPages, total: urgentTotal } = usePagination(urgentItems, 6);
  const { paginated: pagedMovers, page: moversPage, setPage: setMoversPage, totalPages: moversTotalPages, total: moversTotal } = usePagination(fastMovers, 6);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  function fmtValue(n: number) {
    if (n >= 1000000) return `GH₵ ${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `GH₵ ${(n / 1000).toFixed(1)}k`;
    return `GH₵ ${n.toLocaleString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Hello, {firstName}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Stock overview — {outOfStock.length > 0 ? `${outOfStock.length} item${outOfStock.length !== 1 ? 's' : ''} out of stock` : 'All items in stock'}
          </p>
        </div>
        <Link
          to="/inventory"
          className="px-4 h-8 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <Package className="w-3.5 h-3.5" />
          Manage Inventory
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Products"
          value={String(totalItems)}
          sub="Unique products tracked"
          icon={Package}
          color="#06B6D4"
        />
        <KPICard
          label="Low Stock"
          value={String(lowStock.length)}
          sub={`≤ ${LOW_STOCK_THRESHOLD} units remaining`}
          icon={AlertTriangle}
          color="#F59E0B"
        />
        <KPICard
          label="Out of Stock"
          value={String(outOfStock.length)}
          sub="Needs immediate restocking"
          icon={XCircle}
          color={outOfStock.length > 0 ? '#DC2626' : '#10B981'}
        />
        <KPICard
          label="Stock Value"
          value={fmtValue(totalValue)}
          sub="Retail value on hand"
          icon={DollarSign}
          color="#10B981"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Urgent: out of stock + low stock */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Needs Restocking</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Out of stock &amp; low stock items</p>
            </div>
            <Link to="/inventory" className="text-[11px] font-semibold hover:opacity-70" style={{ color: 'hsl(var(--primary))' }}>
              Inventory →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
            </div>
          ) : urgentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Package className="w-8 h-8" style={{ color: 'hsl(142 60% 50%)' }} />
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>All stock levels healthy</p>
            </div>
          ) : (
            <>
              {pagedUrgent.map(p => {
                const isOut = p.stock === 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isOut ? 'hsl(0 70% 94%)' : 'hsl(38 90% 93%)', color: isOut ? 'hsl(0 65% 45%)' : 'hsl(38 80% 40%)' }}
                    >
                      {isOut ? <XCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.category} · {p.supplier || 'No supplier'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold" style={{ color: isOut ? 'hsl(0 65% 45%)' : 'hsl(38 80% 40%)' }}>
                        {isOut ? 'Out' : `${p.stock} left`}
                      </p>
                      <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.price}</p>
                    </div>
                  </div>
                );
              })}
              <div className="px-5 pb-3">
                <Pagination page={urgentPage} pageCount={urgentTotalPages} total={urgentTotal} pageSize={6} onPageChange={setUrgentPage} />
              </div>
            </>
          )}
        </div>

        {/* Fast movers */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-card)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Fast Movers</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>High-demand items to watch</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--primary)) transparent transparent' }} />
            </div>
          ) : fastMovers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Package className="w-8 h-8 opacity-20" style={{ color: 'hsl(var(--foreground))' }} />
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No fast movers tagged yet</p>
              <Link to="/inventory" className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                Mark items as fast mover →
              </Link>
            </div>
          ) : (
            <>
              {pagedMovers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: p.stock <= LOW_STOCK_THRESHOLD ? 'hsl(38 80% 40%)' : '#10B981' }}>
                      {p.stock} in stock
                    </p>
                    <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.price}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
              ))}
              <div className="px-5 pb-3">
                <Pagination page={moversPage} pageCount={moversTotalPages} total={moversTotal} pageSize={6} onPageChange={setMoversPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
