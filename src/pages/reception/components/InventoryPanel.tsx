import { useState, useEffect, useMemo } from 'react';
import { Boxes, AlertTriangle, Package, Search, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import { useParts } from '@/hooks/useParts';
import { useAuth } from '@/hooks/useAuth';
import { AddPartModal } from '@/pages/inventory/page';
import Pagination from '@/components/shared/Pagination';
import type { Part } from '@/types/wireless';

const PAGE_SIZE = 10;

export default function InventoryPanel() {
  const { user } = useAuth();
  const { parts, loading, lowStock, add, patch, remove, adjust } = useParts();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);

  const canSeeCost = user?.role === 'admin';

  const filtered = parts.filter(p => {
    const q = query.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  useEffect(() => { setPage(1); }, [query]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const handleDelete = (p: Part) => {
    if (confirm(`Delete "${p.name}"?`)) remove(p.id);
  };

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

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search parts..."
            className="h-9 pl-8 pr-3 w-full sm:w-64 rounded-lg text-xs outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer"
          style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden overflow-x-auto" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
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
                {['Part', 'Product Code', 'Category', 'Stock', 'Min', 'Cost', 'Sell Price', 'Supplier', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((p, i) => {
                const isLow = p.stock < p.min_stock;
                return (
                  <tr key={p.id} className="transition-colors"
                    style={{ borderBottom: i < paged.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => adjust(p.id, -1)} disabled={p.stock <= 0}
                          className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30 cursor-pointer flex-shrink-0"
                          style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center" style={{ color: isLow ? 'hsl(0 90% 65%)' : 'hsl(var(--foreground))' }}>{p.stock}</span>
                        <button type="button" onClick={() => adjust(p.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-white cursor-pointer flex-shrink-0"
                          style={{ background: '#22c55e' }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.min_stock}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {p.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(var(--foreground))' }}>GH₵ {p.selling_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.supplier ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={isLow
                          ? { background: 'hsl(var(--status-pending-bg))', color: 'hsl(var(--status-pending))' }
                          : { background: 'hsl(var(--status-ready-bg))', color: 'hsl(var(--status-ready))' }}>
                        {isLow ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ background: 'hsl(var(--muted))' }}>
                          <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        </button>
                        <button onClick={() => handleDelete(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ background: 'hsl(var(--muted))' }}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination
        page={page}
        pageCount={Math.ceil(filtered.length / PAGE_SIZE)}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showAdd && (
        <AddPartModal onSave={data => add(data)} onClose={() => setShowAdd(false)} existingParts={parts} canSeeCost={canSeeCost} />
      )}
      {editing && (
        <AddPartModal
          initial={editing}
          onSave={data => patch(editing.id, data)}
          onClose={() => setEditing(null)}
          existingParts={parts}
          canSeeCost={canSeeCost}
        />
      )}
    </div>
  );
}
