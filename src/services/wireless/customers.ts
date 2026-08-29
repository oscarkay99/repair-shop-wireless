import { isSupabaseConfigured, db } from '@/services/supabase';
import type { WCustomer } from '@/types/wireless';

const SEED: WCustomer[] = [
  { id: 'c1', name: 'Kwame Mensah',   phone: '+233 24 111 2233', email: 'kwame@example.com',  address: 'Accra, Ghana', ticket_count: 3, total_spent: 650,  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c2', name: 'Abena Osei',     phone: '+233 20 555 6677', email: 'abena@example.com',  address: 'Kumasi, Ghana', ticket_count: 1, total_spent: 85,   created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c3', name: 'Kofi Agyemang',  phone: '+233 27 888 9900', email: 'kofi@example.com',   address: 'Tema, Ghana', ticket_count: 2, total_spent: 520,  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c4', name: 'Akosua Darko',   phone: '+233 26 333 4455', email: 'akosua@example.com', address: 'Accra, Ghana', ticket_count: 1, total_spent: 120,  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c5', name: 'Fiifi Amo',      phone: '+233 24 777 8899', email: 'fiifi@example.com',  address: 'Cape Coast, Ghana', ticket_count: 1, total_spent: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
let localStore = [...SEED];

export async function getCustomers(): Promise<WCustomer[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Once Supabase answers successfully, trust it completely — even an empty
    // result — rather than keep showing seed data that isn't real and would
    // break any write that tries to link to it (invalid/non-existent id).
    localStore = (data as WCustomer[] | null) ?? [];
    return localStore;
  } catch (e) {
    console.warn('[wireless/customers] falling back to local store', e);
    return [...localStore];
  }
}

export async function createCustomer(input: Omit<WCustomer, 'id' | 'ticket_count' | 'total_spent' | 'created_at' | 'updated_at'>): Promise<WCustomer> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('customers').insert(input).select().single();
    if (error) throw error;
    const c = data as WCustomer;
    localStore = [c, ...localStore];
    return c;
  }
  const c: WCustomer = { ...input, id: crypto.randomUUID(), ticket_count: 0, total_spent: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [c, ...localStore];
  return c;
}

export async function updateCustomer(id: string, patch: Partial<WCustomer>): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.map(c => c.id === id ? { ...c, ...patch } : c);
    return;
  }
  const { error } = await db.from('customers').update(patch).eq('id', id);
  if (error) throw error;
  localStore = localStore.map(c => c.id === id ? { ...c, ...patch } : c);
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.filter(c => c.id !== id);
    return;
  }
  const { error } = await db.from('customers').delete().eq('id', id);
  if (error) {
    // tickets/accessory_sales/payments all ON DELETE SET NULL their
    // customer_id (history is kept, just unlinked), but invoices RESTRICT —
    // a customer with any invoice on file can't be deleted outright.
    if (error.code === '23503') throw new Error('This customer has invoices on file. Delete or reassign those first.');
    throw error;
  }
  localStore = localStore.filter(c => c.id !== id);
}
