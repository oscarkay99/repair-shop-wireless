import { isSupabaseConfigured, db } from '@/services/supabase';
import type { Ticket, TicketComment, TicketStatus } from '@/types/wireless';

const SEED: Ticket[] = [
  { id: 'tk1', ticket_number: 'TK-0005', customer_id: 'c5', device: 'iPhone 15',      brand: 'Apple',   model: '15',     issue: 'Face ID not working',  status: 'pending',     priority: 'normal', deposit_paid: 0,   warranty_days: 30, received_at: '2026-06-12T09:00:00Z', created_at: '2026-06-12T09:00:00Z', updated_at: '2026-06-12T09:00:00Z' },
  { id: 'tk2', ticket_number: 'TK-0001', customer_id: 'c1', device: 'iPhone 14 Pro',  brand: 'Apple',   model: '14 Pro', issue: 'Cracked screen',        status: 'in_progress', priority: 'high',   technician_id: 't1', deposit_paid: 100, warranty_days: 30, received_at: '2026-06-10T10:00:00Z', created_at: '2026-06-10T10:00:00Z', updated_at: '2026-06-11T14:00:00Z' },
  { id: 'tk3', ticket_number: 'TK-0002', customer_id: 'c2', device: 'Samsung S23',    brand: 'Samsung', model: 'S23',    issue: 'Battery replacement',   status: 'pending',     priority: 'normal', technician_id: 't2', deposit_paid: 0,   warranty_days: 30, received_at: '2026-06-11T11:00:00Z', created_at: '2026-06-11T11:00:00Z', updated_at: '2026-06-11T11:00:00Z' },
  { id: 'tk4', ticket_number: 'TK-0003', customer_id: 'c3', device: 'iPhone 13',      brand: 'Apple',   model: '13',     issue: 'Water damage',          status: 'ready',       priority: 'high',   technician_id: 't1', deposit_paid: 200, warranty_days: 30, received_at: '2026-06-09T08:00:00Z', created_at: '2026-06-09T08:00:00Z', updated_at: '2026-06-12T08:00:00Z' },
  { id: 'tk5', ticket_number: 'TK-0004', customer_id: 'c4', device: 'Google Pixel 7', brand: 'Google',  model: 'Pixel 7',issue: 'Charging port repair',  status: 'completed',   priority: 'normal', technician_id: 't3', deposit_paid: 120, warranty_days: 30, received_at: '2026-06-08T09:00:00Z', completed_at: '2026-06-10T16:00:00Z', created_at: '2026-06-08T09:00:00Z', updated_at: '2026-06-10T16:00:00Z' },
];
let localStore = [...SEED];

function nextLocalId(): string {
  return `TK-${String(localStore.length + 1).padStart(4, '0')}`;
}

export async function getTickets(): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [...localStore];
  try {
    const { data, error } = await db
      .from('tickets')
      .select('*, customer:customers(*), technician:technicians(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data?.length) { localStore = data as Ticket[]; }
    return localStore;
  } catch (e) {
    console.warn('[wireless/tickets] falling back to local store', e);
    return [...localStore];
  }
}

export async function getTicket(id: string): Promise<Ticket | null> {
  if (!isSupabaseConfigured) return localStore.find(t => t.id === id) ?? null;
  const { data, error } = await db
    .from('tickets')
    .select('*, customer:customers(*), technician:technicians(*), ticket_comments(*), ticket_parts(*)')
    .eq('id', id)
    .single();
  if (error || !data) return localStore.find(t => t.id === id) ?? null;
  return data as Ticket;
}

export async function createTicket(
  input: Omit<Ticket, 'id' | 'ticket_number' | 'deposit_paid' | 'warranty_days' | 'received_at' | 'created_at' | 'updated_at'>
    & { deposit_paid?: number; warranty_days?: number }
): Promise<Ticket> {
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('tickets').insert(input).select().single();
    if (!error && data) {
      const t = data as Ticket;
      localStore = [t, ...localStore];
      return t;
    }
  }
  const t: Ticket = {
    ...input,
    id: crypto.randomUUID(),
    ticket_number: nextLocalId(),
    deposit_paid: input.deposit_paid ?? 0,
    warranty_days: input.warranty_days ?? 30,
    received_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStore = [t, ...localStore];
  return t;
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const patch: Partial<Ticket> = { status, updated_at: new Date().toISOString() };
  if (status === 'completed') patch.completed_at = new Date().toISOString();
  localStore = localStore.map(t => t.id === id ? { ...t, ...patch } : t);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('tickets').update(patch).eq('id', id);
  if (error) console.warn('[wireless/tickets] status update error', error);
}

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<void> {
  localStore = localStore.map(t => t.id === id ? { ...t, ...patch } : t);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('tickets').update(patch).eq('id', id);
  if (error) console.warn('[wireless/tickets] update error', error);
}

export async function deleteTicket(id: string): Promise<void> {
  localStore = localStore.filter(t => t.id !== id);
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('tickets').delete().eq('id', id);
  if (error) console.warn('[wireless/tickets] delete error', error);
}

export async function addTicketComment(
  ticketId: string,
  body: string,
  authorName: string,
  authorId?: string,
  isInternal = true
): Promise<TicketComment> {
  const comment: TicketComment = {
    id: crypto.randomUUID(),
    ticket_id: ticketId,
    author_id: authorId,
    author_name: authorName,
    body,
    is_internal: isInternal,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const { data, error } = await db.from('ticket_comments').insert(comment).select().single();
    if (!error && data) return data as TicketComment;
  }
  return comment;
}
