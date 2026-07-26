import { isSupabaseConfigured, db } from '@/services/supabase';

// Real inventory-linked parts consumed against a ticket — distinct from
// Repair.parts (a free-text name+status checklist with no stock link).
// Adding/removing a row here drives wireless.parts.stock via DB triggers
// (deduct_part_stock / restore_part_stock), so this must go through the
// real ticket_id (Repair.ticketDbId), not the human-facing ticket number.
export interface TicketPart {
  id: string;
  ticket_id: string;
  part_id: string | null;
  part_name: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
}

export async function getTicketParts(ticketDbId: string): Promise<TicketPart[]> {
  if (!isSupabaseConfigured || !ticketDbId) return [];
  const { data, error } = await db
    .from('ticket_parts')
    .select('*')
    .eq('ticket_id', ticketDbId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as TicketPart[] | null) ?? [];
}

export async function addTicketPart(input: {
  ticketDbId: string;
  partId: string;
  partName: string;
  quantity: number;
  unitCost: number;
}): Promise<TicketPart> {
  const { data, error } = await db
    .from('ticket_parts')
    .insert({
      ticket_id: input.ticketDbId,
      part_id: input.partId,
      part_name: input.partName,
      quantity: input.quantity,
      unit_cost: input.unitCost,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TicketPart;
}

// Deleting the row restores the deducted stock (restore_part_stock trigger).
export async function removeTicketPart(id: string): Promise<void> {
  const { error } = await db.from('ticket_parts').delete().eq('id', id);
  if (error) throw error;
}
