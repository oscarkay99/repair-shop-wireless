import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { getProductsPage } from '@/services/wireless/accessoryStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import { Pencil, Trash2, X, Search, Boxes, Minus, Plus, AlertTriangle } from 'lucide-react';
import type { AccessoryProduct } from '@/services/wireless/accessoryStore';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 10;
const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Screen Protectors', 'Bands', 'Adapters'];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Cases:              { bg: 'rgba(99,102,241,0.18)',  color: '#818cf8' },
  Chargers:           { bg: 'rgba(245,158,11,0.18)',  color: '#fbbf24' },
  Cables:             { bg: 'rgba(139,92,246,0.18)',  color: '#a78bfa' },
  'Screen Protectors': { bg: 'rgba(34,197,94,0.18)', color: '#4ade80' },
  Bands:              { bg: 'rgba(251,191,36,0.18)',  color: '#fde047' },
  Adapters:           { bg: 'rgba(6,182,212,0.18)',   color: '#22d3ee' },
};
function catStyle(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' };
}

const fmt = (n: number) => `¢${n.toFixed(2)}`;
const margin = (p: AccessoryProduct) => (p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0);

interface ProductForm { name: string; sku: string; compatible_with: string; category: string; price: string; cost: string; stock: string; reorder_at: string }
function emptyForm(initial?: AccessoryProduct): ProductForm {
  return {
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    compatible_with: initial?.compatible_with ?? '',
    category: initial?.category ?? 'Cases',
    price: String(initial?.price ?? ''),
    cost: String(initial?.cost ?? ''),
    stock: String(initial?.stock ?? ''),
    reorder_at: String(initial?.reorder_at ?? '5'),
  };
}

function AccessoryModal({ initial, onSave, onClose, existingProducts = [], canSeeCost }: {
  initial?: AccessoryProduct;
  onSave: (d: Omit<AccessoryProduct, 'id' | 'created_at'>) => Promise<unknown>;
  onClose: () => void;
  existingProducts?: AccessoryProduct[];
  /** Wholesale cost is admin-only — a restricted user's save preserves
   *  whatever was already there rather than silently blanking/zeroing it. */
  canSeeCost: boolean;
}) {
  const [form, setForm] = useState<ProductForm>(emptyForm(initial));
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ProductForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const categoryOptions = [...new Set([...CATEGORIES, ...existingProducts.map(p => p.category)])].sort();
  const [addingCategory, setAddingCategory] = useState(initial ? !categoryOptions.includes(initial.category) : false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        sku: form.sku,
        compatible_with: form.compatible_with,
        category: form.category,
        price: parseFloat(form.price) || 0,
        cost: canSeeCost ? (parseFloat(form.cost) || 0) : (initial?.cost ?? 0),
        stock: parseInt(form.stock) || 0,
        reorder_at: parseInt(form.reorder_at) || 0,
      });
      onClose();
    } finally { setSaving(false); }
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
            {initial ? 'Edit Accessory' : 'Add Accessory'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Product Name</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Clear Case for iPhone 15"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Product Code</label>
              <input required value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="CASE-IP15"
                className="w-full h-9 px-3 rounded-lg text-sm outline-none font-mono" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</label>
              {addingCategory ? (
                <div className="flex gap-1.5">
                  <input required autoFocus value={form.category} onChange={e => set('category', e.target.value)}
                    placeholder="New category name"
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
                  <button type="button"
                    onClick={() => { setAddingCategory(false); set('category', categoryOptions[0] ?? ''); }}
                    title="Choose from list instead"
                    className="h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select value={form.category}
                  onChange={e => {
                    if (e.target.value === '__new__') { setAddingCategory(true); set('category', ''); }
                    else set('category', e.target.value);
                  }}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle}>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ Add new category…</option>
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Compatible With</label>
            <input value={form.compatible_with} onChange={e => set('compatible_with', e.target.value)} placeholder="iPhone 15 / 15 Pro"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div className={canSeeCost ? 'grid grid-cols-2 gap-3' : ''}>
            {canSeeCost && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Cost (¢)</label>
                <input type="number" min="0" step="0.01" required value={form.cost} onChange={e => set('cost', e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
            )}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price (¢)</label>
              <input type="number" min="0" step="0.01" required value={form.price} onChange={e => set('price', e.target.value)}
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
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Reorder At</label>
              <input type="number" min="0" required value={form.reorder_at} onChange={e => set('reorder_at', e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg"
              style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Accessory'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface Props {
  showAddModal: boolean;
  onCloseAddModal: () => void;
  /** Stock manager's KPI-tiles-and-cards view instead of the dense admin
   *  table, same treatment as the Parts tab. */
  useCardLayout?: boolean;
  /** Receptionist gets this same card view for visibility, but strictly
   *  view-only — no adjust/edit/delete affordances. Defaults to true so
   *  every existing caller (stock_manager/admin on /inventory) is unaffected. */
  canEdit?: boolean;
}

export default function AccessoriesTab({ showAddModal, onCloseAddModal, useCardLayout, canEdit = true }: Props) {
  const { products, addProduct, patchProduct, removeProduct } = useAccessoryStore();
  const { user } = useAuth();
  // Margin is derived from cost vs. price, so it leaks cost just as much as
  // showing the number outright would — hidden alongside it.
  const canSeeCost = user?.role === 'admin';
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const adjustStock = (p: AccessoryProduct, delta: number) =>
    patchProduct(p.id, { stock: Math.max(0, p.stock + delta) });
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AccessoryProduct | null>(null);

  const [paged, setPaged] = useState<AccessoryProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  const reload = () => {
    setLoading(true);
    return getProductsPage({ page, pageSize: PAGE_SIZE, search: debouncedQuery })
      .then(({ products: rows, total: count }) => { setPaged(rows); setTotal(count); })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [page, debouncedQuery]);

  const filtered = paged;

  const handleDelete = (p: AccessoryProduct) => {
    if (confirm(`Delete "${p.name}"?`)) removeProduct(p.id).then(reload);
  };

  // Card layout works off the full catalog (not the paginated table fetch),
  // same as the Parts tab's card view.
  const cardTotalUnits = products.reduce((s, p) => s + p.stock, 0);
  const cardStockValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const cardLowStockCount = products.filter(p => p.stock <= p.reorder_at).length;
  const cardFiltered = products.filter(p => {
    if (lowStockOnly && p.stock > p.reorder_at) return false;
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  if (useCardLayout) {
    return (
      <div className="space-y-4">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL ACCESSORIES', value: String(products.length), sub: 'unique SKUs' },
            { label: 'LOW STOCK', value: String(cardLowStockCount), sub: `${cardLowStockCount} at or below reorder`, valueColor: cardLowStockCount ? '#f59e0b' : undefined },
            { label: 'TOTAL UNITS', value: String(cardTotalUnits), sub: 'across all accessories' },
            { label: 'STOCK VALUE', value: fmt(cardStockValue), sub: 'at selling price', valueColor: '#22c55e' },
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
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search accessories, SKU…"
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
          {cardFiltered.length} accessor{cardFiltered.length === 1 ? 'y' : 'ies'}
        </p>

        {/* Cards */}
        <div className="space-y-2">
          {cardFiltered.length === 0 ? (
            <div className="py-16 text-center text-xs rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              No accessories found.
            </div>
          ) : cardFiltered.map(p => {
            const isLow = p.stock <= p.reorder_at;
            const cs = catStyle(p.category);
            return (
              <div key={p.id} className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
                style={{ background: 'hsl(var(--card))', border: `1px solid ${isLow ? 'rgba(245,158,11,0.4)' : 'hsl(var(--border))'}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
                  <Boxes className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {p.sku} · <span className="font-semibold" style={{ color: cs.color }}>{p.category}</span>
                  </p>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price</p>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>{fmt(p.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Reorder At</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.reorder_at}</p>
                  </div>
                </div>
                {canEdit ? (
                  <>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button" onClick={() => adjustStock(p, -1)} disabled={p.stock <= 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30"
                        style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-14 text-center">
                        <p className="text-sm font-bold" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</p>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>units</p>
                      </div>
                      <button type="button" onClick={() => adjustStock(p, 1)}
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
                  </>
                ) : (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>units</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showAddModal && (
          <AccessoryModal onSave={data => addProduct(data).then(reload)} onClose={onCloseAddModal} existingProducts={products} canSeeCost={canSeeCost} />
        )}
        {editing && (
          <AccessoryModal
            initial={editing}
            onSave={data => patchProduct(editing.id, data).then(reload)}
            onClose={() => setEditing(null)}
            existingProducts={products}
            canSeeCost={canSeeCost}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchDropdown
          query={query}
          onQueryChange={setQuery}
          suggestions={query.trim() ? filtered.map(p => ({
            id: p.id,
            primary: p.name,
            secondary: `${p.sku} · ${p.category}`,
            meta: fmt(p.price),
            badge: p.stock <= p.reorder_at
              ? { label: 'Low Stock', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
              : undefined,
          })) : []}
          onSelect={item => setQuery(item.primary)}
          placeholder="Search accessories…"
          width={300}
        />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        {loading ? (
          <div className="py-16 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {[
                  'Product', 'Category', 'Price', 'Stock', 'Reorder At',
                  ...(canSeeCost ? ['Margin'] : []),
                  '',
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={canSeeCost ? 7 : 6} className="px-4 py-16 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No accessories found.
                  </td>
                </tr>
              ) : paged.map((p, i) => {
                const cs = catStyle(p.category);
                const m = margin(p);
                const isLow = p.stock <= p.reorder_at;
                return (
                  <tr key={p.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku} · {p.compatible_with}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cs.bg, color: cs.color }}>{p.category}</span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{fmt(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: isLow ? '#f59e0b' : 'hsl(var(--foreground))' }}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.reorder_at}</td>
                    {canSeeCost && (
                      <td className="px-4 py-3 font-bold" style={{ color: m >= 70 ? '#22c55e' : m >= 50 ? '#f59e0b' : 'hsl(var(--primary))' }}>{m}%</td>
                    )}
                    <td className="px-4 py-3">
                      {canEdit && (
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
                      )}
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
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {showAddModal && canEdit && (
        <AccessoryModal onSave={data => addProduct(data).then(reload)} onClose={onCloseAddModal} existingProducts={products} canSeeCost={canSeeCost} />
      )}
      {editing && (
        <AccessoryModal
          initial={editing}
          onSave={data => patchProduct(editing.id, data).then(reload)}
          onClose={() => setEditing(null)}
          existingProducts={products}
          canSeeCost={canSeeCost}
        />
      )}
    </div>
  );
}
