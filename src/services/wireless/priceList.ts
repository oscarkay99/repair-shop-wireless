import { isSupabaseConfigured, db } from '@/services/supabase';
import type { PriceListEntry } from '@/types/wireless';

let localStore: PriceListEntry[] = [];

export async function getPriceList(): Promise<PriceListEntry[]> {
  if (!isSupabaseConfigured) return [...localStore];
  const { data, error } = await db.from('price_list').select('*').order('device_model');
  if (error) throw error;
  localStore = (data as PriceListEntry[] | null) ?? [];
  return localStore;
}

export async function createPriceEntry(input: Omit<PriceListEntry, 'id' | 'created_at' | 'updated_at'>): Promise<PriceListEntry> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('price_list').insert(input).select().single();
    if (error) throw error;
    const entry = data as PriceListEntry;
    localStore = [entry, ...localStore];
    return entry;
  }
  const entry: PriceListEntry = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [entry, ...localStore];
  return entry;
}

export async function updatePriceEntry(id: string, patch: Partial<Omit<PriceListEntry, 'id'>>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await db.from('price_list').update(patch).eq('id', id);
    if (error) throw error;
  }
  localStore = localStore.map(e => e.id === id ? { ...e, ...patch } : e);
}

export async function deletePriceEntry(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await db.from('price_list').delete().eq('id', id);
    if (error) throw error;
  }
  localStore = localStore.filter(e => e.id !== id);
}

/** Case/whitespace-insensitive exact match on device model + issue. */
export function findPrice(list: PriceListEntry[], deviceModel: string, issue: string): PriceListEntry | undefined {
  const model = deviceModel.trim().toLowerCase();
  const iss = issue.trim().toLowerCase();
  if (!model || !iss) return undefined;
  return list.find(e => e.device_model.trim().toLowerCase() === model && e.issue.trim().toLowerCase() === iss);
}
