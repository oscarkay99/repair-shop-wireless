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

export async function adjustStock(id: string, delta: number): Promise<void> {
  const p = localStore.find(x => x.id === id);
  if (!p) return;
  const newStock = Math.max(0, p.stock + delta);
  await updatePart(id, { stock: newStock });
}
