import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useParts } from '@/hooks/useParts';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { getPartsPage } from '@/services/wireless/parts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import AccessoriesTab from './components/AccessoriesTab';
import { AlertTriangle, Pencil, Trash2, X, Search, Boxes, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Part } from '@/types/wireless';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 10;
type InventoryTab = 'parts' | 'accessories';

const fmtCedis = (n: number) => `¢${n.toFixed(2)}`;

const CATEGORIES = ['Screens', 'Batteries', 'Keyboards', 'Connectors', 'Trackpads', 'Other'];

function categoryPrefix(category: string): string {
  const words = category.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 4);
  return (category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GEN');
}

function nextSku(category: string, existingParts: Part[]): string {
  const countInCategory = existingParts.filter(p => p.category === category).length;
  return `${categoryPrefix(category)}-${String(countInCategory + 1).padStart(3, '0')}`;
}

function AddPartModal({
  onSave,
  onClose,
  initial,
  existingParts = [],
  canSeeCost,
}: {
  onSave: (d: Omit<Part, 'id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  onClose: () => void;
  initial?: Part;
  existingParts?: Part[];
  /** Wholesale cost and supplier are admin-only — everyone else who can
   *  otherwise edit parts (stock_manager, sales_manager, receptionist) never
   *  sees or sets them; a restricted user's save preserves whatever was
   *  already there rather than silently blanking/zeroing it. */
  canSeeCost: boolean;
}) {
  const categoryOptions = [...new Set([...CATEGORIES, ...existingParts.map(p => p.category)])].sort();
  const defaultCategory = initial?.category ?? 'Screens';
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? nextSku(defaultCategory, existingParts),
    category: defaultCategory,
    unit_cost: String(initial?.unit_cost ?? ''),
    selling_price: String(initial?.selling_price ?? ''),
    stock: String(initial?.stock ?? ''),
    min_stock: String(initial?.min_stock ?? ''),
    supplier: initial?.supplier ?? '',
  });
  const [addingCategory, setAddingCategory] = useState(initial ? !categoryOptions.includes(initial.category) : false);
  const [skuTouched, setSkuTouched] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Keep the SKU auto-matched to the chosen category — right up until the
  // user edits it themselves, at which point their choice always wins.
  const setCategory = (category: string) => {
    setForm(f => ({ ...f, category, sku: (!initial && !skuTouched) ? nextSku(category, existingParts) : f.sku }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: form.name,
      sku: form.sku,
      category: form.category,
      // A restricted user never sees these fields below, so their form state
      // is whatever it started as (0 / '' for a new part, unchanged for an
      // edit) — always resolve from `initial` here rather than trusting form
      // state, so a restricted edit can't accidentally zero out a real cost.
      unit_cost: canSeeCost ? (parseFloat(form.unit_cost) || 0) : (initial?.unit_cost ?? 0),
      selling_price: parseFloat(form.selling_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      supplier: canSeeCost ? form.supplier : (initial?.supplier ?? ''),
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
              <input required value={form.sku} onChange={e => { set('sku', e.target.value); setSkuTouched(true); }} placeholder="SCR-IP15P"
                className="w-full h-9 px-3 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</label>
              {addingCategory ? (
                <div className="flex gap-1.5">
                  <input required autoFocus value={form.category} onChange={e => setCategory(e.target.value)}
                    placeholder="New category name"
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
                  <button type="button"
                    onClick={() => { setAddingCategory(false); setCategory(categoryOptions[0] ?? ''); }}
                    title="Choose from list instead"
                    className="h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select required value={form.category}
                  onChange={e => {
                    if (e.target.value === '__new__') { setAddingCategory(true); setCategory(''); }
                    else setCategory(e.target.value);
                  }}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle}>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ Add new category…</option>
                </select>
              )}
            </div>
          </div>
          <div className={canSeeCost ? 'grid grid-cols-2 gap-3' : ''}>
            {canSeeCost && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Unit Cost (¢)</label>
                <input type="number" min="0" step="0.01" required value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
            )}
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
          {canSeeCost && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Supplier</label>
              <input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="iFixit GH"
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          )}
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
  // Kept for existingParts validation (needs the full catalog), mutations,
  // and the low-stock/total counts in the subtitle — the table itself below
  // uses a separate paginated fetch so the list view doesn't pull every row.
  const { parts, loading, add, patch, remove, adjust, lowStock } = useParts();
  // Only fetched here for the Accessories tab count badge — AccessoriesTab
  // itself calls useAccessoryStore() independently for the actual data.
  const { products: accessoryProducts } = useAccessoryStore();
  const { user } = useAuth();
  // Reception and stock_manager can view/adjust stock and see selling price
  // (what to quote), but unit cost and supplier are admin-only — and only
  // admin can add a brand-new part type; everyone else can only edit
  // existing ones (adjusting stock, not creating catalog entries).
  const canSeeCost = user?.role === 'admin';
  const canCreatePart = user?.role === 'admin' || user?.role === 'stock_manager';
  // Stock manager's whole job here is "is it in stock, adjust it" — a
  // KPI-tiles-and-cards view built around that, instead of the dense admin
  // table (which also shows things stock_manager can't act on anyway).
  const useCardLayout = user?.role === 'stock_manager';
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [tab, setTab] = useState<InventoryTab>('parts');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddAccessory, setShowAddAccessory] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);

  const [pagedParts, setPagedParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  const reloadTable = () => {
    setTableLoading(true);
    return getPartsPage({ page, pageSize: PAGE_SIZE, search: debouncedQuery })
      .then(({ parts: rows, total: count }) => { setPagedParts(rows); setTotal(count); })
      .finally(() => setTableLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reloadTable(); }, [page, debouncedQuery]);

  useEffect(() => {
    setPageTitle({
      title: 'Inventory',
      subtitle: tab === 'parts' ? `${parts.length} parts · ${lowStock.length} low stock` : 'Retail accessories stock',
      action: tab === 'parts'
        ? (canCreatePart ? { label: 'Add Part', onClick: () => setShowAdd(true) } : undefined)
        : { label: 'Add Accessory', onClick: () => setShowAddAccessory(true) },
    });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle, tab, parts.length, lowStock.length, canCreatePart]);

  const filtered = pagedParts;
  const paged = pagedParts;

  const handleDelete = (p: Part) => {
    if (confirm(`Delete "${p.name}"?`)) remove(p.id).then(reloadTable);
  };

  // Card layout works off the full catalog directly (not the paginated
  // table fetch) — a shop's part catalog is small enough to show at once,
  // and it matches the "everything visible, just filter" feel of the KPI
  // tiles above it.
  const cardTotalUnits = parts.reduce((s, p) => s + p.stock, 0);
  const cardStockValue = parts.reduce((s, p) => s + p.stock * p.selling_price, 0);
  const cardFiltered = parts.filter(p => {
    if (lowStockOnly && p.stock >= p.min_stock) return false;
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      {useCardLayout ? (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
          {([
            { id: 'parts', label: 'Repair Parts', icon: Boxes, count: parts.length },
            { id: 'accessories', label: 'Accessories', icon: ShoppingBag, count: accessoryProducts.length },
          ] as { id: InventoryTab; label: string; icon: typeof Boxes; count: number }[]).map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                style={active
                  ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }
                  : { color: 'hsl(var(--muted-foreground))' }}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={active
                    ? { background: 'hsl(var(--primary))', color: 'white' }
                    : { background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
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
      )}

      {tab === 'accessories' ? (
        <AccessoriesTab showAddModal={showAddAccessory} onCloseAddModal={() => setShowAddAccessory(false)} useCardLayout={useCardLayout} />
      ) : useCardLayout ? (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'TOTAL PARTS', value: String(parts.length), sub: 'unique SKUs' },
              { label: 'LOW STOCK', value: String(lowStock.length), sub: `${lowStock.length} below minimum`, valueColor: lowStock.length ? '#f59e0b' : undefined },
              { label: 'TOTAL UNITS', value: String(cardTotalUnits), sub: 'across all parts' },
              { label: 'STOCK VALUE', value: fmtCedis(cardStockValue), sub: 'at selling price', valueColor: '#22c55e' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-5"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.valueColor ?? 'hsl(var(--foreground))' }}>{card.value}</p>
                <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Search + low stock filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search parts, SKU…"
                className="w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
            <button type="button" onClick={() => setLowStockOnly(v => !v)}
              className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
              style={lowStockOnly
                ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }
                : { border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
            </button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {cardFiltered.length} part{cardFiltered.length === 1 ? '' : 's'}
          </p>

          {/* Cards */}
          <div className="space-y-2">
            {loading ? (
              <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
            ) : cardFiltered.length === 0 ? (
              <div className="py-16 text-center text-xs rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                No parts found.
              </div>
            ) : cardFiltered.map(p => {
              const isLow = p.stock < p.min_stock;
              return (
                <div key={p.id} className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
                  style={{ background: 'hsl(var(--card))', border: `1px solid ${isLow ? 'rgba(245,158,11,0.4)' : 'hsl(var(--border))'}` }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
                    <Boxes className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku} · {p.category}</p>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price</p>
                      <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>{fmtCedis(p.selling_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Reorder At</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.min_stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => adjust(p.id, -1)} disabled={p.stock <= 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30"
                      style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-14 text-center">
                      <p className="text-sm font-bold" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</p>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>units</p>
                    </div>
                    <button type="button" onClick={() => adjust(p.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white"
                      style={{ background: '#22c55e' }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
        {tableLoading ? (
          <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {[
                  'Part Name', 'Product Code', 'Category', 'Stock',
                  ...(canSeeCost ? ['Unit Cost'] : []),
                  'Selling Price', '',
                ].map(h => (
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
                  <td colSpan={canSeeCost ? 7 : 6} className="px-4 py-16 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
                    {canSeeCost && (
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        ¢{p.unit_cost.toFixed(2)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                      ¢{p.selling_price.toFixed(2)}
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
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showAdd && (
        <AddPartModal onSave={data => add(data).then(reloadTable)} onClose={() => setShowAdd(false)} existingParts={parts} canSeeCost={canSeeCost} />
      )}
      {editing && (
        <AddPartModal
          initial={editing}
          onSave={data => patch(editing.id, data).then(reloadTable)}
          onClose={() => setEditing(null)}
          existingParts={parts}
          canSeeCost={canSeeCost}
        />
      )}
      </>
      )}
    </div>
  );
}
