import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useParts } from '@/hooks/useParts';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import AccessoriesTab from './components/AccessoriesTab';
import { AlertTriangle, Pencil, Trash2, X } from 'lucide-react';
import type { Part } from '@/types/wireless';

const PAGE_SIZE = 10;
type InventoryTab = 'parts' | 'accessories';

const CATEGORIES = ['Screens', 'Batteries', 'Keyboards', 'Connectors', 'Trackpads', 'Other'];

function AddPartModal({
  onSave,
  onClose,
  initial,
}: {
  onSave: (d: Omit<Part, 'id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
  initial?: Part;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    category: initial?.category ?? 'Screens',
    unit_cost: String(initial?.unit_cost ?? ''),
    selling_price: String(initial?.selling_price ?? ''),
    stock: String(initial?.stock ?? ''),
    min_stock: String(initial?.min_stock ?? ''),
    supplier: initial?.supplier ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: form.name,
      sku: form.sku,
      category: form.category,
      unit_cost: parseFloat(form.unit_cost) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      supplier: form.supplier,
    });
    onClose();
  };

  const inputStyle = {
    background: 'hsl(var(--muted))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {initial ? 'Edit Part' : 'Add Part'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Part Name</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Galaxy S24 Screen, iPad Battery"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Product Code</label>
              <input required value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="SCR-IP15P"
                className="w-full h-9 px-3 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Unit Cost (¢)</label>
              <input type="number" min="0" step="0.01" required value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price (¢)</label>
              <input type="number" min="0" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Stock</label>
              <input type="number" min="0" required value={form.stock} onChange={e => set('stock', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Min Stock</label>
              <input type="number" min="0" required value={form.min_stock} onChange={e => set('min_stock', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Supplier</label>
            <input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="iFixit GH"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg"
              style={{ background: 'hsl(var(--primary))' }}>
              {initial ? 'Save Changes' : 'Add Part'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function InventoryPage() {
  const { setPageTitle } = usePageTitle();
  const { parts, loading, add, patch, remove, lowStock } = useParts();
  const [tab, setTab] = useState<InventoryTab>('parts');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddAccessory, setShowAddAccessory] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);

  useEffect(() => { setPage(1); }, [query]);

  useEffect(() => {
    setPageTitle({
      title: 'Inventory',
      subtitle: tab === 'parts' ? `${parts.length} parts · ${lowStock.length} low stock` : 'Retail accessories stock',
      action: tab === 'parts'
        ? { label: 'Add Part', onClick: () => setShowAdd(true) }
        : { label: 'Add Accessory', onClick: () => setShowAddAccessory(true) },
    });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle, tab, parts.length, lowStock.length]);

  const filtered = useMemo(() => {
    if (!query) return parts;
    const q = query.toLowerCase();
    return parts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [parts, query]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  [filtered, page]);

  const handleDelete = (p: Part) => {
    if (confirm(`Delete "${p.name}"?`)) remove(p.id);
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        {([
          { id: 'parts', label: 'Parts' },
          { id: 'accessories', label: 'Accessories' },
        ] as { id: InventoryTab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-1 py-3 mr-6 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors"
            style={tab === t.id
              ? { borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }
              : { borderColor: 'transparent', color: 'hsl(var(--muted-foreground))' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accessories' ? (
        <AccessoriesTab showAddModal={showAddAccessory} onCloseAddModal={() => setShowAddAccessory(false)} />
      ) : (
      <>
      {/* Search */}
      <SearchDropdown
        query={query}
        onQueryChange={setQuery}
        suggestions={query.trim() ? filtered.map(p => ({
          id: p.id,
          primary: p.name,
          secondary: `${p.sku} · ${p.category}`,
          meta: `${p.stock} units`,
          badge: p.stock < p.min_stock
            ? { label: 'Low Stock', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
            : undefined,
        })) : []}
        onSelect={item => setQuery(item.primary)}
        placeholder="Search parts…"
        width={300}
      />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        {loading ? (
          <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Part Name', 'Product Code', 'Category', 'Stock', 'Unit Cost', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No parts found.
                  </td>
                </tr>
              ) : paged.map((p, i) => {
                const isLow = p.stock < p.min_stock;
                return (
                  <tr key={p.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted)/0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />}
                        <span className="text-sm font-medium" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {p.category}
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          {p.stock} units
                        </span>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
                          {p.stock} units
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      ¢{p.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditing(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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
        <AddPartModal onSave={add} onClose={() => setShowAdd(false)} />
      )}
      {editing && (
        <AddPartModal
          initial={editing}
          onSave={data => patch(editing.id, data)}
          onClose={() => setEditing(null)}
        />
      )}
      </>
      )}
    </div>
  );
}
