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
  sold_at: string;
}

// Seed data ────────────────────────────────────────────────────────────────────

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
  { id: 's8', sale_number: 'SL-008', product_id: 'ap5', product_name: 'AirPods Pro 2 Silicone Case',  category: 'Cases',             quantity: 2, unit_price: 12.99, total: 25.98, payment_method: 'Transfer', sold_at: '2026-06-09T15:00:00Z' },
  { id: 's7', sale_number: 'SL-007', product_id: 'ap7', product_name: 'USB-C to 3.5mm Adapter',       category: 'Adapters',          quantity: 4, unit_price:  9.99, total: 39.96, payment_method: 'Cash',     sold_at: '2026-06-09T13:30:00Z' },
  { id: 's6', sale_number: 'SL-006', product_id: 'ap1', product_name: 'iPhone 15 Pro Clear Case',     category: 'Cases',             quantity: 1, unit_price: 29.99, total: 29.99, payment_method: 'Card',     sold_at: '2026-06-09T12:00:00Z' },
  { id: 's5', sale_number: 'SL-005', product_id: 'ap6', product_name: 'Apple Watch Sport Band 41mm',  category: 'Bands',             quantity: 1, unit_price: 24.99, total: 24.99, payment_method: 'Cash',     sold_at: '2026-06-09T10:45:00Z' },
  { id: 's4', sale_number: 'SL-004', product_id: 'ap3', product_name: 'USB-C to Lightning Cable 1m',  category: 'Cables',            quantity: 2, unit_price: 19.99, total: 39.98, payment_method: 'Card',     sold_at: '2026-06-09T09:20:00Z' },
  { id: 's3', sale_number: 'SL-003', product_id: 'ap2', product_name: 'MagSafe Charger 15W',          category: 'Chargers',          quantity: 1, unit_price: 39.99, total: 39.99, payment_method: 'Card',     sold_at: '2026-06-08T14:00:00Z' },
  { id: 's2', sale_number: 'SL-002', product_id: 'ap4', product_name: 'iPhone 14 Tempered Glass',     category: 'Screen Protectors', quantity: 3, unit_price: 14.99, total: 44.97, payment_method: 'Cash',     sold_at: '2026-06-08T11:30:00Z' },
  { id: 's1', sale_number: 'SL-001', product_id: 'ap1', product_name: 'iPhone 15 Pro Clear Case',     category: 'Cases',             quantity: 2, unit_price: 29.99, total: 59.98, payment_method: 'Card',     sold_at: '2026-06-08T10:15:00Z' },
];

let productStore = [...PRODUCT_SEED];
let saleStore    = [...SALE_SEED];

// Products ─────────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<AccessoryProduct[]> {
  return [...productStore];
}

export async function createProduct(input: Omit<AccessoryProduct, 'id' | 'created_at'>): Promise<AccessoryProduct> {
  const p: AccessoryProduct = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  productStore = [p, ...productStore];
  return p;
}

export async function updateProduct(id: string, patch: Partial<AccessoryProduct>): Promise<void> {
  productStore = productStore.map(p => p.id === id ? { ...p, ...patch } : p);
}

export async function deleteProduct(id: string): Promise<void> {
  productStore = productStore.filter(p => p.id !== id);
}

// Sales ────────────────────────────────────────────────────────────────────────

export async function getSales(): Promise<AccessorySaleRecord[]> {
  return [...saleStore];
}

export async function createSale(input: Omit<AccessorySaleRecord, 'id' | 'sale_number' | 'sold_at'>): Promise<AccessorySaleRecord> {
  const num = saleStore.length + 1;
  const s: AccessorySaleRecord = {
    ...input,
    id: crypto.randomUUID(),
    sale_number: `SL-${String(num).padStart(3, '0')}`,
    sold_at: new Date().toISOString(),
  };
  saleStore = [s, ...saleStore];
  return s;
}

export async function deleteSale(id: string): Promise<void> {
  saleStore = saleStore.filter(s => s.id !== id);
}
