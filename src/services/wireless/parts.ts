import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Part } from '@/types/wireless';

const SEED: Part[] = [
  { id: 'p1', name: 'iPhone 14 Pro Screen', sku: 'SCR-IP14P', category: 'Screen',  unit_cost: 280, selling_price: 380, stock: 3,  min_stock: 5,  supplier: 'iFixit GH',   created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p2', name: 'Samsung S23 Battery',  sku: 'BAT-SS23',  category: 'Battery', unit_cost: 45,  selling_price: 80,  stock: 8,  min_stock: 5,  supplier: 'TechParts GH', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p3', name: 'iPhone 13 Battery',    sku: 'BAT-IP13',  category: 'Battery', unit_cost: 38,  selling_price: 70,  stock: 12, min_stock: 5,  supplier: 'TechParts GH', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p4', name: 'USB-C Charging Port',  sku: 'PORT-USBC', category: 'Port',    unit_cost: 15,  selling_price: 35,  stock: 2,  min_stock: 10, supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p5', name: 'Lightning Port',       sku: 'PORT-LTN',  category: 'Port',    unit_cost: 18,  selling_price: 38,  stock: 6,  min_stock: 5,  supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'p6', name: 'iPhone 15 Screen',     sku: 'SCR-IP15',  category: 'Screen',  unit_cost: 320, selling_price: 420, stock: 1,  min_stock: 5,  supplier: 'iFixit GH',    created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
let localStore = [...SEED];

export async function getParts(): Promise<Part[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('parts')
      .select('*')
      .order('name');
    if (error) throw error;
    if (data?.length) { localStore = data as Part[]; }
    return localStore;
  } catch (e) {
    console.warn('[wireless/parts] falling back to local store', e);
    return [...localStore];
  }
}

export async function createPart(input: Omit<Part, 'id' | 'created_at' | 'updated_at'>): Promise<Part> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('parts').insert(input).select().single();
    if (!error && data) {
      const p = data as Part;
      localStore = [p, ...localStore];
      return p;
    }
  }
  const p: Part = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [p, ...localStore];
  return p;
}

export async function updatePart(id: string, patch: Partial<Part>): Promise<void> {
  localStore = localStore.map(p => p.id === id ? { ...p, ...patch } : p);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('parts').update(patch).eq('id', id);
  if (error) console.warn('[wireless/parts] update error', error);
}

export async function deletePart(id: string): Promise<void> {
  localStore = localStore.filter(p => p.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('parts').delete().eq('id', id);
  if (error) console.warn('[wireless/parts] delete error', error);
}

export async function adjustStock(id: string, delta: number): Promise<void> {
  const p = localStore.find(x => x.id === id);
  if (!p) return;
  const newStock = Math.max(0, p.stock + delta);
  await updatePart(id, { stock: newStock });
}
