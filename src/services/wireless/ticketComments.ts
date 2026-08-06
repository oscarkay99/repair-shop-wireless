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

export interface ReassignmentRequest {
  commentId: string;
  ticketId: string;
  ticketNumber: string;
  device: string;
  customerName: string;
  requestedBy: string;
  reason: string;
  createdAt: string;
}

type ReassignmentRequestRow = TicketCommentRow & {
  ticket: { id: string; ticket_number: string; device: string; customer_name: string } | null;
};

function normalizeReassignmentRequest(row: ReassignmentRequestRow): ReassignmentRequest {
  return {
    commentId: row.id,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket?.ticket_number ?? row.ticket_id,
    device: row.ticket?.device ?? '—',
    customerName: row.ticket?.customer_name ?? '—',
    requestedBy: row.author_name,
    // Comment body is stored as "Reassignment requested: <reason>" — strip
    // the prefix back off for display rather than showing it twice.
    reason: row.body.replace(/^Reassignment requested:\s*/i, ''),
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

/**
 * Same channel as addTicketComment, tagged so it can be surfaced as an
 * actionable list (see getPendingReassignmentRequests) instead of only
 * being visible to whoever happens to open this exact ticket.
 */
export async function requestReassignment(ticketId: string, reason: string, authorName: string): Promise<TicketComment> {
  if (!isSupabaseConfigured) throw new Error('Comments require Supabase to be configured.');
  const { data: sessionData } = await supabase.auth.getSession();
  const { data, error } = await db
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_id: sessionData.session?.user?.id ?? null,
      author_name: authorName,
      body: `Reassignment requested: ${reason}`,
      is_internal: true,
      request_type: 'reassignment',
    })
    .select('id, ticket_id, author_name, body, created_at')
    .single();
  if (error) throw error;
  return normalize(data as TicketCommentRow);
}

/** For Admin/Reception — every reassignment request nobody has handled yet, across all tickets. */
export async function getPendingReassignmentRequests(): Promise<ReassignmentRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('ticket_comments')
    .select('id, ticket_id, author_name, body, created_at, ticket:tickets(id,ticket_number,device,customer_name)')
    .eq('request_type', 'reassignment')
    .eq('resolved', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as unknown as ReassignmentRequestRow[] | null) ?? []).map(normalizeReassignmentRequest);
}

/** Marks a request handled — whether by reassigning, or deciding no change is needed. */
export async function resolveReassignmentRequest(commentId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await db
    .from('ticket_comments')
    .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: sessionData.session?.user?.id ?? null })
    .eq('id', commentId);
  if (error) throw error;
}

export interface ApprovalRequest {
  commentId: string;
  ticketId: string;
  ticketNumber: string;
  device: string;
  customerName: string;
  requestedBy: string;
  reason: string;
  amount: number | null;
  createdAt: string;
}

function normalizeApprovalRequest(row: ReassignmentRequestRow): ApprovalRequest {
  // Body is stored as "Additional approval needed: <reason> (+GHS <amount>)"
  // — amount is optional (a technician might not always have a number yet).
  const match = row.body.match(/^Additional approval needed:\s*(.*?)(?:\s*\(\+GHS\s*([\d.]+)\))?$/i);
  return {
    commentId: row.id,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket?.ticket_number ?? row.ticket_id,
    device: row.ticket?.device ?? '—',
    customerName: row.ticket?.customer_name ?? '—',
    requestedBy: row.author_name,
    reason: match?.[1]?.trim() || row.body,
    amount: match?.[2] ? parseFloat(match[2]) : null,
    createdAt: row.created_at,
  };
}

/**
 * A technician finding extra work needed mid-repair can't quote/notify the
 * customer directly (that's reception's job) — this logs the ask the same
 * "tagged request, someone else applies it" way as requestReassignment, so
 * it surfaces on an actionable list instead of only living in Internal Notes.
 */
export async function requestAdditionalApproval(ticketId: string, reason: string, amount: number | null, authorName: string): Promise<TicketComment> {
  if (!isSupabaseConfigured) throw new Error('Comments require Supabase to be configured.');
  const { data: sessionData } = await supabase.auth.getSession();
  const body = `Additional approval needed: ${reason}${amount ? ` (+GHS ${amount.toFixed(2)})` : ''}`;
  const { data, error } = await db
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_id: sessionData.session?.user?.id ?? null,
      author_name: authorName,
      body,
      is_internal: true,
      request_type: 'additional_approval',
    })
    .select('id, ticket_id, author_name, body, created_at')
    .single();
  if (error) throw error;
  return normalize(data as TicketCommentRow);
}

/** For Admin/Reception — every additional-cost approval nobody has relayed a decision on yet. */
export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db
    .from('ticket_comments')
    .select('id, ticket_id, author_name, body, created_at, ticket:tickets(id,ticket_number,device,customer_name)')
    .eq('request_type', 'additional_approval')
    .eq('resolved', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as unknown as ReassignmentRequestRow[] | null) ?? []).map(normalizeApprovalRequest);
}

/** Records the customer's decision as a normal internal note (visible to the
 *  technician in the ticket's comment thread) and marks the request handled. */
export async function resolveApprovalRequest(commentId: string, ticketId: string, decision: 'approved' | 'declined', authorName: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id ?? null;
  const { error } = await db
    .from('ticket_comments')
    .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: uid })
    .eq('id', commentId);
  if (error) throw error;

  await db.from('ticket_comments').insert({
    ticket_id: ticketId,
    author_id: uid,
    author_name: authorName,
    body: decision === 'approved' ? 'Customer approved the additional cost — go ahead.' : 'Customer declined the additional cost — do not proceed with the extra work.',
    is_internal: true,
  });
}
