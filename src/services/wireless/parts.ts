import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Part } from '@/types/wireless';
import { ACCESSORY_CATEGORIES } from './accessoryStore';

const SEED: Part[] = [
  { id: 'p1', name: 'iPhone 15 Pro Screen (OLED)', sku: 'SCR-IP15P',    category: 'Screens',    unit_cost: 189.99, selling_price: 280, stock: 8,  min_stock: 5, supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p2', name: 'iPhone 14 Battery',           sku: 'BAT-IP14',     category: 'Batteries',  unit_cost: 39.99,  selling_price: 80,  stock: 2,  min_stock: 5, supplier: 'TechParts GH', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p3', name: 'MacBook Air M2 Keyboard',     sku: 'KB-MBA-M2',    category: 'Keyboards',  unit_cost: 129.99, selling_price: 200, stock: 4,  min_stock: 3, supplier: 'MacParts GH',  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p4', name: 'iPad Pro 12.9 Screen',        sku: 'SCR-IPADP129', category: 'Screens',    unit_cost: 249.99, selling_price: 380, stock: 3,  min_stock: 3, supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p5', name: 'Apple Watch S8 Battery',      sku: 'BAT-AWS8',     category: 'Batteries',  unit_cost: 29.99,  selling_price: 60,  stock: 1,  min_stock: 5, supplier: 'TechParts GH', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p6', name: 'iPhone 15 Charging Port',     sku: 'PORT-IP15',    category: 'Connectors', unit_cost: 19.99,  selling_price: 50,  stock: 12, min_stock: 5, supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p7', name: 'MacBook Pro 14" Trackpad',    sku: 'TP-MBP14',     category: 'Trackpads',  unit_cost: 89.99,  selling_price: 150, stock: 2,  min_stock: 5, supplier: 'MacParts GH',  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
let localStore = [...SEED];

// wireless.parts is a single shared catalog table for both repair parts and
// sellable accessories (see services/wireless/accessoryStore.ts) — filter out
// accessory categories here so this repair-parts view stays separate.
function isRepairPart(p: Part) {
  return !ACCESSORY_CATEGORIES.includes(p.category);
}

export async function getParts(): Promise<Part[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('parts')
      .select('*')
      .order('name');
    if (error) throw error;
    // Trust a successful (even empty) response completely — don't keep showing
    // seed parts that aren't real rows, since selling/using one would try to
    // reference a non-existent id and fail.
    localStore = (data as Part[] | null)?.filter(isRepairPart) ?? [];
    return localStore;
  } catch (e) {
    console.warn('[wireless/parts] falling back to local store', e);
    return [...localStore];
  }
}

export interface PartsPageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PartsPageResult {
  parts: Part[];
  total: number;
}

// Additive, separate from getParts() — that one is relied on elsewhere (the
// repair-ticket part picker, dashboard low-stock widget) for the *full*
// catalog. This is only for the Inventory list view's own paginated table.
export async function getPartsPage(query: PartsPageQuery = {}): Promise<PartsPageResult> {
  const { page = 1, pageSize = 10, search } = query;
  if (!isSupabaseConfigured) {
    const rows = localStore.filter(isRepairPart);
    return { parts: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
  }

  let q = db
    .from('parts')
    .select('*', { count: 'exact' })
    .not('category', 'in', `(${ACCESSORY_CATEGORIES.map(c => `"${c}"`).join(',')})`)
    .order('name');

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`name.ilike.${term},sku.ilike.${term},category.ilike.${term},supplier.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { parts: (data as Part[] | null) ?? [], total: count ?? 0 };
}

export async function createPart(input: Omit<Part, 'id' | 'created_at' | 'updated_at'>): Promise<Part> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('parts').insert(input).select().single();
    if (error) throw error;
    const p = data as Part;
    localStore = [p, ...localStore];
    return p;
  }
  const p: Part = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [p, ...localStore];
  return p;
}

export async function updatePart(id: string, patch: Partial<Part>): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.map(p => p.id === id ? { ...p, ...patch } : p);
    return;
  }
  const { error } = await db.from('parts').update(patch).eq('id', id);
  if (error) throw error;
  localStore = localStore.map(p => p.id === id ? { ...p, ...patch } : p);
}

export async function deletePart(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.filter(p => p.id !== id);
    return;
  }
  const { error } = await db.from('parts').delete().eq('id', id);
  if (error) throw error;
  localStore = localStore.filter(p => p.id !== id);
}

// Atomic on the DB side (wireless.adjust_part_stock does `stock = stock +
// delta` in one UPDATE) — computing the new value from the client cache and
// writing it back as an absolute number would lose concurrent adjustments
// from another open session.
export async function adjustStock(id: string, delta: number): Promise<void> {
  if (!isSupabaseConfigured) {
    const p = localStore.find(x => x.id === id);
    if (!p) return;
    localStore = localStore.map(x => x.id === id ? { ...x, stock: Math.max(0, x.stock + delta) } : x);
    return;
  }
  const { data, error } = await db.rpc('adjust_part_stock', { p_part_id: id, p_delta: delta });
  if (error) throw error;
  localStore = localStore.map(x => x.id === id ? { ...x, stock: data as number } : x);
}
