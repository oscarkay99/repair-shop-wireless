import { isSupabaseConfigured, supabase, db } from '@/services/supabase';

// Separate from the free-text `notes` on the ticket itself (technician-facing
// progress notes) — this is staff-to-staff coordination, e.g. a technician
// flagging an extra issue/part found mid-repair so reception can decide on
// pricing and be the one to tell the customer, since technicians don't deal
// with customers directly. `is_internal` is always true here; there's no
// customer-visible variant of this channel.
export interface TicketComment {
  id: string;
  ticketId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

type TicketCommentRow = {
  id: string;
  ticket_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

function normalize(row: TicketCommentRow): TicketComment {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('ticket_comments')
    .select('id, ticket_id, author_name, body, created_at')
    .eq('ticket_id', ticketId)
    .eq('is_internal', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as TicketCommentRow[] | null)?.map(normalize) ?? [];
}

export async function addTicketComment(ticketId: string, body: string, authorName: string): Promise<TicketComment> {
  if (!isSupabaseConfigured) throw new Error('Comments require Supabase to be configured.');
  const { data: sessionData } = await supabase.auth.getSession();
  const { data, error } = await db
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_id: sessionData.session?.user?.id ?? null,
      author_name: authorName,
      body,
      is_internal: true,
    })
    .select('id, ticket_id, author_name, body, created_at')
    .single();
  if (error) throw error;
  return normalize(data as TicketCommentRow);
}
