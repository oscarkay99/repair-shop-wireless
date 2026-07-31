import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import SearchDropdown from '@/components/shared/SearchDropdown';
import Pagination from '@/components/shared/Pagination';
import DateRangePicker, { type DateRange } from '@/components/shared/DateRangePicker';
import { Pencil, Trash2, X, ShoppingCart, TrendingUp, ShoppingBag, AlertTriangle, Printer } from 'lucide-react';
import type { AccessoryProduct, AccessorySaleRecord } from '@/services/wireless/accessoryStore';
import { downloadAccessorySaleReceiptPdf } from '@/utils/accessorySaleReceiptPdf';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';
import CustomerPicker from '@/components/shared/CustomerPicker';
import type { WCustomer } from '@/types/wireless';

const PAGE_SIZE = 10;

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `¢${n.toFixed(2)}`;
const margin = (p: AccessoryProduct) => Math.round(((p.price - p.cost) / p.price) * 100);

// ── Category badge colors ─────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Cases:             { bg: 'rgba(99,102,241,0.18)',  color: '#818cf8' },
  Chargers:          { bg: 'rgba(245,158,11,0.18)',  color: '#fbbf24' },
  Cables:            { bg: 'rgba(139,92,246,0.18)',  color: '#a78bfa' },
  'Screen Protectors':{ bg: 'rgba(34,197,94,0.18)', color: '#4ade80' },
  Bands:             { bg: 'rgba(251,191,36,0.18)',  color: '#fde047' },
  Adapters:          { bg: 'rgba(6,182,212,0.18)',   color: '#22d3ee' },
};
function catStyle(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' };
}

// ── Payment badge colors ──────────────────────────────────────────────────────

const PAY_COLORS: Record<string, { bg: string; color: string }> = {
  Transfer: { bg: 'hsl(var(--muted))',              color: 'hsl(var(--foreground))' },
  Cash:     { bg: 'rgba(34,197,94,0.18)',           color: '#4ade80' },
  Card:     { bg: 'rgba(99,102,241,0.18)',          color: '#818cf8' },
};

// ── Add/Edit Product Modal ────────────────────────────────────────────────────

const CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Screen Protectors', 'Bands', 'Adapters'];

interface ProductForm { name: string; sku: string; compatible_with: string; category: string; price: string; cost: string; stock: string; reorder_at: string }
const emptyForm = (): ProductForm => ({ name: '', sku: '', compatible_with: '', category: 'Cases', price: '', cost: '', stock: '', reorder_at: '5' });

function ProductModal({ initial, onSave, onClose }: {
  initial?: AccessoryProduct;
  onSave: (f: ProductForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(initial
    ? { name: initial.name, sku: initial.sku, compatible_with: initial.compatible_with, category: initial.category, price: String(initial.price), cost: String(initial.cost), stock: String(initial.stock), reorder_at: String(initial.reorder_at) }
    : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ProductForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{initial ? 'Edit Product' : 'Add Product'}</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handle} className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {([
            { key: 'name',          label: 'Product Name *', type: 'text',   required: true },
            { key: 'sku',           label: 'Product Code',   type: 'text',   required: false },
            { key: 'compatible_with', label: 'Compatible With', type: 'text', required: false },
          ] as Array<{ key: keyof ProductForm; label: string; type: string; required: boolean }>).map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</label>
              <input required={f.required} type={f.type} value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'price',     label: 'Price (¢) *', required: true },
              { key: 'cost',      label: 'Cost (¢) *',  required: true },
              { key: 'stock',     label: 'Stock *',      required: true },
              { key: 'reorder_at', label: 'Reorder At', required: false },
            ] as Array<{ key: keyof ProductForm; label: string; required: boolean }>).map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</label>
                <input required={f.required} type="number" step="0.01" min="0" value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Saving…' : initial ? 'Update' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Record Sale Modal ─────────────────────────────────────────────────────────

function RecordSaleModal({ products, settings, onSave, onClose }: {
  products: AccessoryProduct[];
  settings?: { business_name?: string; tagline?: string; phone?: string; address?: string; logo_url?: string | null };
  onSave: (s: Omit<AccessorySaleRecord, 'id' | 'sale_number' | 'sold_at'>) => Promise<AccessorySaleRecord>;
  onClose: () => void;
}) {
  const [productId, setProductId]   = useState(products[0]?.id ?? '');
  const [qty, setQty]               = useState('1');
  const [payment, setPayment]       = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
  const [saving, setSaving]         = useState(false);
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WCustomer | null>(null);
  const [customerError, setCustomerError] = useState('');

  const { taxEnabled, vatRate } = useTaxSettings();
  const { showToast } = useToast();
  const product  = products.find(p => p.id === productId);
  const subtotal = product ? product.price * Number(qty) : 0;
  const tax      = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const total    = subtotal + tax;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    // A typed customer name must be linked to a real customer record — either
    // picked from the dropdown or created inline through it.
    if (customerName.trim() && !selectedCustomer) {
      setCustomerError('Select an existing customer or create a new one from the dropdown.');
      return;
    }
    setCustomerError('');
    setSaving(true);
    try {
      const sale = await onSave({
        product_id:     product.id,
        product_name:   product.name,
        category:       product.category,
        quantity:       Number(qty),
        unit_price:     product.price,
        total,
        payment_method: payment,
        customer_id:    selectedCustomer?.id ?? null,
        customer_name:  customerName || 'Walk-in Customer',
      });
      onClose();
      // The sale itself already succeeded at this point — a receipt PDF
      // failure (e.g. logo fetch) shouldn't read as the sale having failed.
      try { await downloadAccessorySaleReceiptPdf({ sale, settings }); }
      catch (e) { showToast(errMessage(e, 'Sale recorded, but the receipt could not be generated'), 'error'); }
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Record Sale</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <form onSubmit={handle} className="px-5 py-4 space-y-3">
          <CustomerPicker
            value={customerName}
            phone={customerPhone}
            required={false}
            label="Customer"
            placeholder="Search by name or phone… (optional)"
            onChange={(name, phone, customer) => {
              setCustomerName(name);
              setCustomerPhone(phone);
              setSelectedCustomer(customer ?? null);
            }}
          />
          {customerName.trim() && !selectedCustomer && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Phone *</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                placeholder="+233…" />
            </div>
          )}
          {customerError && (
            <p className="text-xs" style={{ color: '#dc2626' }}>{customerError}</p>
          )}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Product *</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Quantity *</label>
              <input required type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment</label>
              <select value={payment} onChange={e => setPayment(e.target.value as typeof payment)}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                {(['Cash', 'Card', 'Transfer'] as const).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {product && (
            <div className="space-y-1 py-2 px-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
              {taxEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>VAT ({vatRate}%)</span>
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{fmt(tax)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(total)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs font-semibold"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: 'hsl(var(--primary))' }}>{saving ? 'Recording…' : 'Record Sale'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'products' | 'sales';

export default function AccessoriesSalesPage() {
  const { setPageTitle } = usePageTitle();
  const { products, sales, loading, addProduct, patchProduct, removeProduct, recordSale } = useAccessoryStore();
  const { settings } = useWirelessSettings();
  const { showToast } = useToast();

  const [tab, setTab]               = useState<Tab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [salesSearch, setSalesSearch]     = useState('');
  const [salesDateRange, setSalesDateRange] = useState<DateRange>({ from: '', to: '' });
  const [productPage, setProductPage]   = useState(1);
  const [salesPage, setSalesPage]       = useState(1);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct]     = useState<AccessoryProduct | null>(null);

  useEffect(() => { setProductPage(1); }, [productSearch]);
  useEffect(() => { setSalesPage(1); }, [salesSearch, salesDateRange]);

  useEffect(() => {
    setPageTitle({
      title: 'Accessories Sales',
      subtitle: 'Retail accessories inventory & sales',
      action: { label: 'Record Sale', onClick: () => setShowSaleModal(true) },
    });
  }, [setPageTitle]);

  // ── derived ────────────────────────────────────────────────────────────────

  const today       = new Date().toDateString();
  const monthStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const todayRevenue  = useMemo(() => sales.filter(s => new Date(s.sold_at).toDateString() === today).reduce((a, s) => a + s.total, 0), [sales, today]);
  const monthRevenue  = useMemo(() => sales.filter(s => s.sold_at >= monthStart).reduce((a, s) => a + s.total, 0), [sales, monthStart]);
  const itemsToday    = useMemo(() => sales.filter(s => new Date(s.sold_at).toDateString() === today).reduce((a, s) => a + s.quantity, 0), [sales, today]);
  const lowStock      = products.filter(p => p.stock <= p.reorder_at).length;

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const s of sales) {
      if (!map[s.product_name]) map[s.product_name] = { name: s.product_name, qty: 0, revenue: 0 };
      map[s.product_name].qty     += s.quantity;
      map[s.product_name].revenue += s.total;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [sales]);
  const maxRevenue = Math.max(1, ...topProducts.map(p => p.revenue));

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : products;
  }, [products, productSearch]);

  const filteredSales = useMemo(() => {
    const q = salesSearch.trim().toLowerCase();
    const from = salesDateRange.from ? new Date(salesDateRange.from + 'T00:00') : null;
    const to   = salesDateRange.to   ? new Date(salesDateRange.to   + 'T23:59:59') : null;
    return sales.filter(s => {
      if (q && !s.product_name.toLowerCase().includes(q) && !s.sale_number.toLowerCase().includes(q)) return false;
      if (from || to) {
        const d = new Date(s.sold_at);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
      }
      return true;
    });
  }, [sales, salesSearch, salesDateRange]);

  const pagedProducts = useMemo(() =>
    filteredProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE),
  [filteredProducts, productPage]);

  const pagedSales = useMemo(() =>
    filteredSales.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE),
  [filteredSales, salesPage]);

  const salesTotal = filteredSales.reduce((a, s) => a + s.total, 0);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full -m-6">

      {/* Tab bar */}
      <div className="flex items-center border-b px-6 flex-shrink-0"
        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: 'Products' },
          { id: 'sales',    label: 'Sales History' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-1 py-3 mr-8 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors"
            style={tab === t.id
              ? { borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }
              : { borderColor: 'transparent', color: 'hsl(var(--muted-foreground))' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-16 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "TODAY'S REVENUE", value: fmt(todayRevenue), icon: ShoppingCart, red: true },
                    { label: 'MONTH REVENUE',   value: fmt(monthRevenue), icon: TrendingUp,   red: false },
                    { label: 'ITEMS SOLD TODAY', value: String(itemsToday), icon: ShoppingBag, red: false },
                    { label: 'LOW STOCK ALERTS', value: String(lowStock),   icon: AlertTriangle, red: false },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border px-5 py-4 flex items-start gap-3"
                      style={{ background: 'hsl(var(--card))', borderColor: s.red ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: s.red ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))' }}>
                        <s.icon className="w-4 h-4" style={{ color: s.red ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                        <p className="text-2xl font-bold mt-0.5" style={{ color: s.red ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Selling Products */}
                <div className="rounded-xl border p-5" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'hsl(var(--foreground))' }}>Top Selling Products</p>
                  {topProducts.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topProducts.map(p => (
                        <div key={p.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</span>
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.qty} sold · {fmt(p.revenue)}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${(p.revenue / maxRevenue) * 100}%`, background: 'hsl(var(--primary))' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Sales */}
                <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--foreground))' }}>Recent Sales</p>
                    <button onClick={() => setTab('sales')} className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>View all</button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {sales.slice(0, 6).map(s => (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3"
                        style={{ borderColor: 'hsl(var(--border))' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{s.product_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {s.sale_number} · {new Date(s.sold_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(s.total)}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.payment_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
            {tab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <SearchDropdown
                    query={productSearch}
                    onQueryChange={setProductSearch}
                    suggestions={productSearch.trim() ? filteredProducts.map(p => ({
                      id: p.id,
                      primary: p.name,
                      secondary: `${p.sku} · ${p.category}`,
                      meta: `${fmt(p.price)}`,
                      badge: p.stock <= p.reorder_at
                        ? { label: 'Low Stock', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
                        : undefined,
                    })) : []}
                    onSelect={item => setProductSearch(item.primary)}
                    placeholder="Search products…"
                    width={224}
                  />
                  <button onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white"
                    style={{ background: 'hsl(var(--primary))' }}>
                    + Add Product
                  </button>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Product', 'Category', 'Price', 'Stock', 'Reorder At', 'Margin', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedProducts.length === 0 ? (
                        <tr><td colSpan={7} className="px-5 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No products found</td></tr>
                      ) : pagedProducts.map((p, i) => {
                        const cs = catStyle(p.category);
                        const m  = margin(p);
                        return (
                          <tr key={p.id} className="transition-colors"
                            style={{ borderBottom: i < pagedProducts.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku} · {p.compatible_with}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: cs.bg, color: cs.color }}>{p.category}</span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(p.price)}</td>
                            <td className="px-5 py-3.5 font-semibold" style={{ color: p.stock <= p.reorder_at ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{p.stock}</td>
                            <td className="px-5 py-3.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.reorder_at}</td>
                            <td className="px-5 py-3.5 font-bold" style={{ color: m >= 70 ? '#4ade80' : m >= 50 ? '#fbbf24' : 'hsl(var(--primary))' }}>{m}%</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setEditProduct(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                                  style={{ background: 'hsl(var(--muted))' }}>
                                  <Pencil className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                </button>
                                <button onClick={() => removeProduct(p.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg"
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
                  </div>
                </div>
                <Pagination
                  page={productPage}
                  pageCount={Math.ceil(filteredProducts.length / PAGE_SIZE)}
                  total={filteredProducts.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setProductPage}
                />
              </div>
            )}

            {/* ── SALES HISTORY ────────────────────────────────────────────── */}
            {tab === 'sales' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SearchDropdown
                      query={salesSearch}
                      onQueryChange={setSalesSearch}
                      suggestions={salesSearch.trim() ? filteredSales.map(s => ({
                      id: s.id,
                      primary: s.sale_number,
                      secondary: s.product_name,
                      meta: fmt(s.total),
                      badge: { label: s.payment_method, bg: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' },
                    })) : []}
                      onSelect={item => setSalesSearch(item.primary)}
                      placeholder="Search sales…"
                      width={224}
                    />
                    <DateRangePicker value={salesDateRange} onChange={setSalesDateRange} label="Sale date" />
                  </div>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Total: <span className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(salesTotal)}</span>
                  </p>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Sale #', 'Product', 'Qty', 'Unit Price', 'Total', 'Payment', 'Date', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSales.length === 0 ? (
                        <tr><td colSpan={8} className="px-5 py-10 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales found</td></tr>
                      ) : pagedSales.map((s, i) => {
                        const ps = PAY_COLORS[s.payment_method] ?? PAY_COLORS.Card;
                        return (
                          <tr key={s.id} className="transition-colors"
                            style={{ borderBottom: i < pagedSales.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                            <td className="px-5 py-3.5 font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{s.sale_number}</td>
                            <td className="px-5 py-3.5">
                              <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{s.product_name}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.category}</p>
                            </td>
                            <td className="px-5 py-3.5" style={{ color: 'hsl(var(--foreground))' }}>{s.quantity}</td>
                            <td className="px-5 py-3.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt(s.unit_price)}</td>
                            <td className="px-5 py-3.5 font-bold" style={{ color: 'hsl(var(--foreground))' }}>{fmt(s.total)}</td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: ps.bg, color: ps.color }}>{s.payment_method}</span>
                            </td>
                            <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {new Date(s.sold_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </td>
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => downloadAccessorySaleReceiptPdf({ sale: s, settings: settings ?? undefined })
                                  .catch(e => showToast(errMessage(e, 'Failed to generate receipt'), 'error'))}
                                title="Download receipt"
                                className="w-7 h-7 flex items-center justify-center rounded-lg"
                                style={{ background: 'hsl(var(--muted))' }}>
                                <Printer className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
                <Pagination
                  page={salesPage}
                  pageCount={Math.ceil(filteredSales.length / PAGE_SIZE)}
                  total={filteredSales.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setSalesPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showSaleModal    && <RecordSaleModal products={products} settings={settings ?? undefined} onSave={recordSale} onClose={() => setShowSaleModal(false)} />}
      {showAddProduct   && <ProductModal onSave={async f => { await addProduct({ name: f.name, sku: f.sku, compatible_with: f.compatible_with, category: f.category, price: Number(f.price), cost: Number(f.cost), stock: Number(f.stock), reorder_at: Number(f.reorder_at) }); }} onClose={() => setShowAddProduct(false)} />}
      {editProduct      && <ProductModal initial={editProduct} onSave={async f => { await patchProduct(editProduct.id, { name: f.name, sku: f.sku, compatible_with: f.compatible_with, category: f.category, price: Number(f.price), cost: Number(f.cost), stock: Number(f.stock), reorder_at: Number(f.reorder_at) }); }} onClose={() => setEditProduct(null)} />}
    </div>
  );
}
