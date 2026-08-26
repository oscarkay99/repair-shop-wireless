import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Technician } from '@/types/wireless';

const SEED: Technician[] = [
  { id: 't1', name: 'Ama Owusu',     phone: '+233 24 100 0001', email: 'ama@wireless.com',   specialty: 'iPhone & iOS',       status: 'available', rating: 4.9, total_completed: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't2', name: 'Joe Asante',    phone: '+233 24 100 0002', email: 'joe@wireless.com',   specialty: 'Android & Samsung',  status: 'available', rating: 4.7, total_completed: 38, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't3', name: 'Yaw Frimpong',  phone: '+233 24 100 0003', email: 'yaw@wireless.com',   specialty: 'General Repairs',    status: 'available', rating: 4.6, total_completed: 29, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't4', name: 'Adjoa Mensah',  phone: '+233 24 100 0004', email: 'adjoa@wireless.com', specialty: 'Motherboard & Logic',status: 'unavailable', unavailable_from: new Date().toISOString().slice(0,10), unavailable_until: new Date(Date.now() + 3*86400000).toISOString().slice(0,10), rating: 4.8, total_completed: 21, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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

// Used when a "technician" role gets attached to a profile outside the
// Technicians page's own Add/Create-Login flows (e.g. Settings > Users) —
// lets callers check whether that profile already has a linked technician
// row before creating a new one, so a role edit can't produce a duplicate.
export async function findTechnicianByProfileId(profileId: string): Promise<Technician | null> {
  if (!isSupabaseConfigured) return localStore.find(t => t.profile_id === profileId) ?? null;
  const { data, error } = await db.from('technicians').select('*').eq('profile_id', profileId).maybeSingle();
  if (error) throw error;
  return (data as Technician | null) ?? null;
}

// Used by the same two flows as findTechnicianByProfileId (Settings > Users
// invite / role-change to technician) to catch the other duplication path:
// a roster row added via the Technicians page's own "Add Technician" (which
// has no login yet — that page's "Create Login" button links profile_id onto
// that same row) getting a *second*, separate row created for it here
// instead, because this flow only ever checked by profile_id, which a
// brand-new user can never already have. Any ticket assigned against the
// original orphan row before this becomes invisible in that technician's
// own portal, which matches strictly by profile_id. Match case-insensitively
// and only against rows with no login yet, mirroring the one-time backfill
// in 20260722010000_technician_scoped_ticket_access.sql.
export async function findUnlinkedTechnicianByName(name: string): Promise<Technician | null> {
  const target = name.trim().toLowerCase();
  if (!target) return null;
  if (!isSupabaseConfigured) {
    return localStore.find(t => !t.profile_id && t.name.trim().toLowerCase() === target) ?? null;
  }
  const { data, error } = await db.from('technicians').select('*').is('profile_id', null).ilike('name', name.trim());
  if (error) throw error;
  return ((data as Technician[] | null) ?? [])[0] ?? null;
}

export async function createTechnician(input: Omit<Technician, 'id' | 'total_completed' | 'rating' | 'created_at' | 'updated_at'>): Promise<Technician> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('technicians').insert(input).select().single();
    if (error) throw error;
    const t = data as Technician;
    localStore = [t, ...localStore];
    return t;
  }
  const t: Technician = { ...input, id: crypto.randomUUID(), rating: 5.0, total_completed: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStore = [t, ...localStore];
  return t;
}

export async function updateTechnician(id: string, patch: Partial<Technician>): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.map(t => t.id === id ? { ...t, ...patch } : t);
    return;
  }
  const { error } = await db.from('technicians').update(patch).eq('id', id);
  if (error) throw error;
  localStore = localStore.map(t => t.id === id ? { ...t, ...patch } : t);
}

export async function deleteTechnician(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    localStore = localStore.filter(t => t.id !== id);
    return;
  }
  const { error } = await db.from('technicians').delete().eq('id', id);
  if (error) throw error;
  localStore = localStore.filter(t => t.id !== id);
}
