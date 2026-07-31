import { useMemo, useState } from 'react';
import { ShoppingCart, Banknote, Package, Search } from 'lucide-react';
import { useAccessoryStore } from '@/hooks/useAccessoryStore';
import { useWirelessSettings } from '@/hooks/useWirelessSettings';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { useWirelessCustomers } from '@/hooks/useWirelessCustomers';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';
import type { AccessoryProduct } from '@/services/wireless/accessoryStore';
import { downloadAccessorySaleReceiptPdf } from '@/utils/accessorySaleReceiptPdf';
import CustomerPicker from '@/components/shared/CustomerPicker';
import type { WCustomer } from '@/types/wireless';

type SalePaymentMethod = 'Cash' | 'Card' | 'Transfer';
const PAYMENT_METHODS: SalePaymentMethod[] = ['Cash', 'Card', 'Transfer'];

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function SalesPanel() {
  const { products, sales, loading, recordSale } = useAccessoryStore();
  const { settings } = useWirelessSettings();
  const { taxEnabled, vatRate } = useTaxSettings();
  const { add: addCustomer } = useWirelessCustomers();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AccessoryProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<SalePaymentMethod>('Cash');
  const [submitting, setSubmitting] = useState(false);
  const [customerMode, setCustomerMode]   = useState<'existing' | 'new'>('existing');
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WCustomer | null>(null);
  const [customerError, setCustomerError] = useState('');

  const salesToday = useMemo(() => sales.filter(s => isToday(s.sold_at)), [sales]);
  const revenueToday = useMemo(() => salesToday.reduce((sum, s) => sum + s.total, 0), [salesToday]);
  const inStock = useMemo(() => products.reduce((sum, p) => sum + p.stock, 0), [products]);

  const filtered = products.filter(p => !query.trim() || p.name.toLowerCase().includes(query.toLowerCase()));

  const subtotal = selected ? selected.price * quantity : 0;
  const tax      = taxEnabled ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
  const total    = subtotal + tax;

  const handleRecordSale = async () => {
    if (!selected) return;
    // Existing tab: a typed name must resolve to a real customer record —
    // picked from the dropdown or created inline through it. New tab: name
    // and phone are typed fresh and the customer is created right here on
    // submit (same split as the New Ticket modal's Existing/New toggle).
    if (customerMode === 'existing' && customerName.trim() && !selectedCustomer) {
      setCustomerError('Select an existing customer or create a new one from the dropdown.');
      return;
    }
    if (customerMode === 'new' && customerName.trim() && !customerPhone.trim()) {
      setCustomerError('Phone number is required to create a new customer.');
      return;
    }
    setCustomerError('');
    setSubmitting(true);
    try {
      const customer = customerMode === 'new' && customerName.trim() && !selectedCustomer
        ? await addCustomer({ name: customerName.trim(), phone: customerPhone.trim(), email: '', address: '' })
        : selectedCustomer;
      const sale = await recordSale({
        product_id: selected.id,
        product_name: selected.name,
        category: selected.category,
        quantity,
        unit_price: selected.price,
        total,
        payment_method: method,
        customer_id: customer?.id ?? null,
        customer_name: customerName || 'Walk-in Customer',
      });
      setSelected(null);
      setQuantity(1);
      setMethod('Cash');
      setCustomerMode('existing');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      // The sale itself already succeeded at this point — a receipt PDF
      // failure (e.g. logo fetch) shouldn't read as the sale having failed.
      try { await downloadAccessorySaleReceiptPdf({ sale, settings: settings ?? undefined }); }
      catch (e) { showToast(errMessage(e, 'Sale recorded, but the receipt could not be generated'), 'error'); }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--muted))' }}>
            <ShoppingCart className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
          <div>
            <p className="text-xl font-black leading-none" style={{ color: 'hsl(var(--foreground))' }}>{salesToday.length}</p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Sales Today</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <Banknote className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <div>
            <p className="text-xl font-black leading-none" style={{ color: 'hsl(var(--foreground))' }}>GH₵{revenueToday.toFixed(2)}</p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Revenue Today</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,1,24,0.1)' }}>
            <Package className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <p className="text-xl font-black leading-none" style={{ color: 'hsl(var(--foreground))' }}>{inStock}</p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>In Stock</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Record a Sale</p>

        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search accessories..."
              className="w-full pl-8 pr-3 h-9 rounded-xl text-xs outline-none"
              style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-xl border divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {loading ? (
              <p className="py-6 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No accessories found.</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer"
                style={{ background: selected?.id === p.id ? 'hsl(var(--muted))' : 'transparent' }}
              >
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.category} · {p.stock} in stock</p>
                </div>
                <p className="text-xs font-bold flex-shrink-0" style={{ color: 'hsl(var(--foreground))' }}>GH₵{p.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Selling <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{selected.name}</span>
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
            {(['existing', 'new'] as const).map(mode => (
              <button key={mode} type="button"
                onClick={() => {
                  setCustomerMode(mode);
                  setCustomerError('');
                  setSelectedCustomer(null);
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="flex-1 text-xs font-bold py-1.5 transition-colors cursor-pointer"
                style={customerMode === mode
                  ? { background: 'hsl(var(--primary))', color: 'white' }
                  : { background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>
                {mode === 'existing' ? 'Existing' : 'New'}
              </button>
            ))}
          </div>
        </div>
        {customerMode === 'new' ? (
          <>
            <CustomerPicker
              createMode
              value={customerName}
              phone={customerPhone}
              required={false}
              label="Customer Name"
              placeholder="Full name (optional — leave blank for walk-in)"
              onChange={(name, phone, customer) => {
                setCustomerName(name);
                if (customer) setCustomerPhone(phone);
                setSelectedCustomer(customer ?? null);
              }}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Phone{customerName.trim() ? ' *' : ''}</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-xl text-xs outline-none"
                style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                placeholder="+233…" />
            </div>
          </>
        ) : (
          <>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer Phone *</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl text-xs outline-none"
                  style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  placeholder="+233…" />
              </div>
            )}
          </>
        )}
        {customerError && (
          <p className="text-xs" style={{ color: '#dc2626' }}>{customerError}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Quantity</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold cursor-pointer"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>−</button>
              <span className="flex-1 text-center text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{quantity}</span>
              <button onClick={() => setQuantity(q => (selected ? Math.min(selected.stock, q + 1) : q + 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold cursor-pointer"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>+</button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment</label>
            <div className="flex gap-1">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className="flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer"
                  style={method === m
                    ? { borderColor: 'hsl(var(--primary))', background: 'rgba(239,1,24,0.1)', color: 'hsl(var(--primary))' }
                    : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected && taxEnabled && (
          <div className="space-y-1 py-2 px-3 rounded-lg" style={{ background: 'hsl(var(--background))' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span>
              <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>GH₵{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>VAT ({vatRate}%)</span>
              <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>GH₵{tax.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleRecordSale}
          disabled={!selected || submitting}
          className="w-full h-9 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          style={{ background: 'hsl(var(--primary))' }}
        >
          <ShoppingCart className="w-4 h-4" />
          {selected ? `Record Sale — GH₵${total.toFixed(2)}` : 'Select an accessory'}
        </button>
      </div>
    </div>
  );
}
