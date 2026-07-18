import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Technician } from '@/types/wireless';

const SEED: Technician[] = [
  { id: 't1', name: 'Ama Owusu',     phone: '+233 24 100 0001', email: 'ama@wireless.com',   specialty: 'iPhone & iOS',       status: 'available', rating: 4.9, total_completed: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't2', name: 'Joe Asante',    phone: '+233 24 100 0002', email: 'joe@wireless.com',   specialty: 'Android & Samsung',  status: 'busy',      rating: 4.7, total_completed: 38, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't3', name: 'Yaw Frimpong',  phone: '+233 24 100 0003', email: 'yaw@wireless.com',   specialty: 'General Repairs',    status: 'available', rating: 4.6, total_completed: 29, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't4', name: 'Adjoa Mensah',  phone: '+233 24 100 0004', email: 'adjoa@wireless.com', specialty: 'Motherboard & Logic',status: 'off_duty',  rating: 4.8, total_completed: 21, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
let localStore = [...SEED];

export async function getTechnicians(): Promise<Technician[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('technicians')
      .select('*')
      .order('name');
    if (error) throw error;
    // Trust a successful (even empty) response completely — don't keep showing
    // seed technicians once the real table is reachable.
    localStore = (data as Technician[] | null) ?? [];
    return localStore;
  } catch (e) {
    console.warn('[wireless/technicians] falling back to local store', e);
    return [...localStore];
  }
}

export async function createTechnician(input: Omit<Technician, 'id' | 'total_completed' | 'rating' | 'created_at' | 'updated_at'>): Promise<Technician> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('technicians').insert(input).select().single();
    if (!error && data) {
      const t = data as Technician;
      localStore = [t, ...localStore];
      return t;
    }
  }
  const t: Technician = { ...input, id: crypto.randomUUID(), rating: 5.0, total_completed: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [t, ...localStore];
  return t;
}

export async function updateTechnician(id: string, patch: Partial<Technician>): Promise<void> {
  localStore = localStore.map(t => t.id === id ? { ...t, ...patch } : t);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('technicians').update(patch).eq('id', id);
  if (error) console.warn('[wireless/technicians] update error', error);
}

export async function deleteTechnician(id: string): Promise<void> {
  localStore = localStore.filter(t => t.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('technicians').delete().eq('id', id);
  if (error) console.warn('[wireless/technicians] delete error', error);
}
