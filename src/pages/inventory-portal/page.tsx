import { useEffect, useState } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useParts } from '@/hooks/useParts';
import { Boxes, AlertTriangle, Package, Plus, Search } from 'lucide-react';

export default function InventoryPortalPage() {
  const { setPageTitle } = usePageTitle();
  const { parts, loading, lowStock } = useParts();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPageTitle({ title: 'Inventory Portal', subtitle: 'Parts and supplies management' });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  const filtered = parts.filter(p => {
    const q = query.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: 'hsl(38 70% 8%)', borderColor: 'hsl(38 60% 20%)' }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--status-pending))' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--status-pending))' }}>
              {lowStock.length} item{lowStock.length > 1 ? 's' : ''} below minimum stock
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(38 60% 50%)' }}>
              {lowStock.map(p => p.name).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search parts..."
            className="h-8 pl-8 pr-3 w-48 rounded-lg text-xs outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>
        <button className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Boxes className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No parts found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Part', 'Product Code', 'Category', 'Stock', 'Min', 'Cost', 'Sell Price', 'Supplier', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isLow = p.stock < p.min_stock;
                return (
                  <tr key={p.id} className="transition-colors"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.category}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: isLow ? 'hsl(0 90% 65%)' : 'hsl(var(--foreground))' }}>{p.stock}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.min_stock}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {p.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {p.selling_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.supplier ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={isLow
                          ? { background: 'hsl(var(--status-pending-bg))', color: 'hsl(var(--status-pending))' }
                          : { background: 'hsl(var(--status-ready-bg))', color: 'hsl(var(--status-ready))' }}>
                        {isLow ? 'Low Stock' : 'OK'}
                      </span>
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
