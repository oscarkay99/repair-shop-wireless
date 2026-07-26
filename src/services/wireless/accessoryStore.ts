import { isSupabaseConfigured, db } from '@/services/supabase';

// Types ────────────────────────────────────────────────────────────────────────

export interface AccessoryProduct {
  id: string;
  name: string;
  sku: string;
  compatible_with: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorder_at: number;
  created_at: string;
}

export interface AccessorySaleRecord {
  id: string;
  sale_number: string;
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: 'Cash' | 'Card' | 'Transfer';
  payment_status: 'paid' | 'partial' | 'unpaid';
  sold_at: string;
  customer_id?: string | null;
  customer_name?: string;
}

// wireless.parts is a single shared catalog for repair parts and sellable
// accessories (wireless.sale_items.part_id references it directly) — this list
// is how the two Inventory tabs stay split despite sharing one table.
export const ACCESSORY_CATEGORIES = ['Cases', 'Chargers', 'Cables', 'Screen Protectors', 'Bands', 'Adapters'];

type PartRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_cost: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  compatible_with?: string | null;
  created_at: string;
};

type SaleRow = {
  id: string;
  sale_number: string;
  customer_id?: string | null;
  customer_name: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  part_id?: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

function toProduct(row: PartRow): AccessoryProduct {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    compatible_with: row.compatible_with ?? '',
    category: row.category,
    price: row.selling_price,
    cost: row.unit_cost,
    stock: row.stock,
    reorder_at: row.min_stock,
    created_at: row.created_at,
  };
}

function toPartPatch(input: Partial<AccessoryProduct>) {
  const patch: Record<string, unknown> = {};
  if ('name' in input) patch.name = input.name;
  if ('sku' in input) patch.sku = input.sku;
  if ('compatible_with' in input) patch.compatible_with = input.compatible_with;
  if ('category' in input) patch.category = input.category;
  if ('price' in input) patch.selling_price = input.price;
  if ('cost' in input) patch.unit_cost = input.cost;
  if ('stock' in input) patch.stock = input.stock;
  if ('reorder_at' in input) patch.min_stock = input.reorder_at;
  return patch;
}

// Seed data (local / offline fallback) ──────────────────────────────────────────

const PRODUCT_SEED: AccessoryProduct[] = [
  { id: 'ap1', name: 'iPhone 15 Pro Clear Case',      sku: 'ACC-CS-IP15P',  compatible_with: 'iPhone 15 Pro',        category: 'Cases',            price: 29.99, cost:  8.40, stock: 25, reorder_at:  5, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap2', name: 'MagSafe Charger 15W',           sku: 'ACC-CHR-MSAFE', compatible_with: 'iPhone 12 and later',  category: 'Chargers',         price: 39.99, cost: 14.00, stock: 18, reorder_at:  5, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap3', name: 'USB-C to Lightning Cable 1m',   sku: 'ACC-CBL-UCL1',  compatible_with: 'All Lightning devices', category: 'Cables',           price: 19.99, cost:  4.60, stock: 30, reorder_at:  8, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap4', name: 'iPhone 14 Tempered Glass',      sku: 'ACC-SP-IP14',   compatible_with: 'iPhone 14',            category: 'Screen Protectors', price: 14.99, cost:  2.55, stock: 40, reorder_at: 10, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap5', name: 'AirPods Pro 2 Silicone Case',   sku: 'ACC-CS-APP2',   compatible_with: 'AirPods Pro 2nd Gen',  category: 'Cases',            price: 12.99, cost:  2.99, stock: 15, reorder_at:  4, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap6', name: 'Apple Watch Sport Band 41mm',   sku: 'ACC-BD-AW41',   compatible_with: 'Apple Watch 41mm',     category: 'Bands',            price: 24.99, cost:  5.99, stock: 12, reorder_at:  3, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap7', name: 'USB-C to 3.5mm Adapter',        sku: 'ACC-ADP-UCJ',   compatible_with: 'USB-C devices',        category: 'Adapters',         price:  9.99, cost:  2.00, stock: 22, reorder_at:  5, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ap8', name: 'iPhone 15 Privacy Screen',      sku: 'ACC-SP-IP15PV', compatible_with: 'iPhone 15 series',     category: 'Screen Protectors', price: 19.99, cost:  4.00, stock:  8, reorder_at:  5, created_at: '2026-01-01T00:00:00Z' },
];

const SALE_SEED: AccessorySaleRecord[] = [
  { id: 's8', sale_number: 'SL-008', product_id: 'ap5', product_name: 'AirPods Pro 2 Silicone Case',  category: 'Cases',             quantity: 2, unit_price: 12.99, total: 25.98, payment_method: 'Transfer', payment_status: 'paid', sold_at: '2026-06-09T15:00:00Z' },
  { id: 's7', sale_number: 'SL-007', product_id: 'ap7', product_name: 'USB-C to 3.5mm Adapter',       category: 'Adapters',          quantity: 4, unit_price:  9.99, total: 39.96, payment_method: 'Cash', payment_status: 'paid', sold_at: '2026-06-09T13:30:00Z' },
  { id: 's6', sale_number: 'SL-006', product_id: 'ap1', product_name: 'iPhone 15 Pro Clear Case',     category: 'Cases',             quantity: 1, unit_price: 29.99, total: 29.99, payment_method: 'Card', payment_status: 'paid', sold_at: '2026-06-09T12:00:00Z' },
  { id: 's5', sale_number: 'SL-005', product_id: 'ap6', product_name: 'Apple Watch Sport Band 41mm',  category: 'Bands',             quantity: 1, unit_price: 24.99, total: 24.99, payment_method: 'Cash', payment_status: 'paid', sold_at: '2026-06-09T10:45:00Z' },
  { id: 's4', sale_number: 'SL-004', product_id: 'ap3', product_name: 'USB-C to Lightning Cable 1m',  category: 'Cables',            quantity: 2, unit_price: 19.99, total: 39.98, payment_method: 'Card', payment_status: 'paid', sold_at: '2026-06-09T09:20:00Z' },
  { id: 's3', sale_number: 'SL-003', product_id: 'ap2', product_name: 'MagSafe Charger 15W',          category: 'Chargers',          quantity: 1, unit_price: 39.99, total: 39.99, payment_method: 'Card', payment_status: 'paid', sold_at: '2026-06-08T14:00:00Z' },
  { id: 's2', sale_number: 'SL-002', product_id: 'ap4', product_name: 'iPhone 14 Tempered Glass',     category: 'Screen Protectors', quantity: 3, unit_price: 14.99, total: 44.97, payment_method: 'Cash', payment_status: 'paid', sold_at: '2026-06-08T11:30:00Z' },
  { id: 's1', sale_number: 'SL-001', product_id: 'ap1', product_name: 'iPhone 15 Pro Clear Case',     category: 'Cases',             quantity: 2, unit_price: 29.99, total: 59.98, payment_method: 'Card', payment_status: 'paid', sold_at: '2026-06-08T10:15:00Z' },
];

let productStore = [...PRODUCT_SEED];
let saleStore    = [...SALE_SEED];

// Products ─────────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<AccessoryProduct[]> {
  if (!isSupabaseConfigured) return [...productStore];
  try {
    const { data, error } = await db.from('parts').select('*').order('name');
    if (error) throw error;
    // Trust a successful (even empty) response completely — don't keep showing
    // seed products that aren't real rows, since selling one would try to
    // reference a non-existent part id and fail.
    productStore = ((data as PartRow[] | null) ?? [])
      .filter(row => ACCESSORY_CATEGORIES.includes(row.category))
      .map(toProduct);
    return productStore;
  } catch (e) {
    console.warn('[wireless/accessoryStore] falling back to local product store', e);
    return [...productStore];
  }
}

export interface ProductsPageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProductsPageResult {
  products: AccessoryProduct[];
  total: number;
}

// Additive, separate from getProducts() — that one is relied on elsewhere
// (Sales page's product picker, dashboards) for the *full* accessory catalog.
// This is only for the Accessories tab's own paginated table.
export async function getProductsPage(query: ProductsPageQuery = {}): Promise<ProductsPageResult> {
  const { page = 1, pageSize = 10, search } = query;
  if (!isSupabaseConfigured) {
    return { products: productStore.slice((page - 1) * pageSize, page * pageSize), total: productStore.length };
  }

  let q = db
    .from('parts')
    .select('*', { count: 'exact' })
    .in('category', ACCESSORY_CATEGORIES)
    .order('name');

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},sku.ilike.${term},category.ilike.${term},compatible_with.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { products: ((data as PartRow[] | null) ?? []).map(toProduct), total: count ?? 0 };
}

export async function createProduct(input: Omit<AccessoryProduct, 'id' | 'created_at'>): Promise<AccessoryProduct> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('parts').insert({
      name: input.name,
      sku: input.sku,
      compatible_with: input.compatible_with,
      category: input.category,
      selling_price: input.price,
      unit_cost: input.cost,
      stock: input.stock,
      min_stock: input.reorder_at,
    }).select().single();
    if (error) throw error;
    const p = toProduct(data as PartRow);
    productStore = [p, ...productStore];
    return p;
  }
  const p: AccessoryProduct = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  productStore = [p, ...productStore];
  return p;
}

export async function updateProduct(id: string, patch: Partial<AccessoryProduct>): Promise<void> {
  if (!isSupabaseConfigured) {
    productStore = productStore.map(p => p.id === id ? { ...p, ...patch } : p);
    return;
  }
  const { error } = await db.from('parts').update(toPartPatch(patch)).eq('id', id);
  if (error) throw error;
  productStore = productStore.map(p => p.id === id ? { ...p, ...patch } : p);
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    productStore = productStore.filter(p => p.id !== id);
    return;
  }
  const { error } = await db.from('parts').delete().eq('id', id);
  if (error) throw error;
  productStore = productStore.filter(p => p.id !== id);
}

// Sales ────────────────────────────────────────────────────────────────────────

export async function getSales(): Promise<AccessorySaleRecord[]> {
  if (!isSupabaseConfigured) return [...saleStore];
  try {
    const [{ data: sales, error: salesError }, { data: items, error: itemsError }] = await Promise.all([
      db.from('accessory_sales').select('*').order('created_at', { ascending: false }),
      db.from('sale_items').select('*'),
    ]);
    if (salesError) throw salesError;
    if (itemsError) throw itemsError;

    const itemsBySale = new Map<string, SaleItemRow[]>();
    ((items as SaleItemRow[] | null) ?? []).forEach(item => {
      const existing = itemsBySale.get(item.sale_id) ?? [];
      existing.push(item);
      itemsBySale.set(item.sale_id, existing);
    });

    const mapped: AccessorySaleRecord[] = ((sales as SaleRow[] | null) ?? []).flatMap(sale => {
      const firstItem = itemsBySale.get(sale.id)?.[0];
      if (!firstItem) return [];
      return [{
        id: sale.id,
        sale_number: sale.sale_number,
        product_id: firstItem.part_id ?? '',
        product_name: firstItem.item_name,
        category: productStore.find(p => p.id === firstItem.part_id)?.category ?? '',
        quantity: firstItem.quantity,
        unit_price: firstItem.unit_price,
        total: sale.total,
        payment_method: (sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)) as AccessorySaleRecord['payment_method'],
        payment_status: sale.payment_status as AccessorySaleRecord['payment_status'],
        sold_at: sale.created_at,
        customer_id: sale.customer_id ?? null,
        customer_name: sale.customer_name || undefined,
      }];
    });

    // Trust a successful (even empty) response completely — don't keep showing seed sales.
    saleStore = mapped;
    return saleStore;
  } catch (e) {
    console.warn('[wireless/accessoryStore] falling back to local sale store', e);
    return [...saleStore];
  }
}

export async function createSale(input: Omit<AccessorySaleRecord, 'id' | 'sale_number' | 'sold_at' | 'payment_status'>): Promise<AccessorySaleRecord> {
  if (isSupabaseConfigured) {
    // record_accessory_sale bundles the sale row, its line item, and the
    // stock decrement into one atomic DB transaction — previously this was
    // 3 separate client-side calls (read stock, then two writes), which
    // could leave a sale recorded with no stock change if any step failed,
    // and raced two concurrent sales of the same last unit against each
    // other since the stock read-then-write wasn't locked.
    const { data, error } = await db.rpc('record_accessory_sale', {
      p_product_id: input.product_id || null,
      p_product_name: input.product_name,
      p_quantity: input.quantity,
      p_unit_price: input.unit_price,
      p_total: input.total,
      p_payment_method: input.payment_method.toLowerCase(),
      p_customer_id: input.customer_id ?? null,
      p_customer_name: input.customer_name || '',
    }).single();
    if (error) throw error;

    const saleRow = data as { id: string; sale_number: string; created_at: string };
    const s: AccessorySaleRecord = { ...input, payment_status: 'paid', id: saleRow.id, sale_number: saleRow.sale_number, sold_at: saleRow.created_at };
    saleStore = [s, ...saleStore];
    return s;
  }

  const num = saleStore.length + 1;
  const s: AccessorySaleRecord = {
    ...input,
    payment_status: 'paid',
    id: crypto.randomUUID(),
    sale_number: `SL-${String(num).padStart(3, '0')}`,
    sold_at: new Date().toISOString(),
  };
  saleStore = [s, ...saleStore];
  return s;
}

export async function updateSalePaymentStatus(id: string, status: AccessorySaleRecord['payment_status']): Promise<void> {
  if (!isSupabaseConfigured) {
    saleStore = saleStore.map(s => s.id === id ? { ...s, payment_status: status } : s);
    return;
  }
  const { error } = await db.from('accessory_sales').update({ payment_status: status }).eq('id', id);
  if (error) throw error;
  saleStore = saleStore.map(s => s.id === id ? { ...s, payment_status: status } : s);
}

export async function deleteSale(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    saleStore = saleStore.filter(s => s.id !== id);
    return;
  }
  const { error } = await db.from('accessory_sales').delete().eq('id', id);
  if (error) throw error;
  saleStore = saleStore.filter(s => s.id !== id);
}
