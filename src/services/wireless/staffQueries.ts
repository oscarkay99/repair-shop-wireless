import { isSupabaseConfigured, db, supabase } from '@/services/supabase';

export type StaffQueryCategory = 'conduct' | 'performance' | 'attendance' | 'policy' | 'other';
export type StaffQueryStatus = 'open' | 'responded' | 'closed';

export interface StaffQuery {
  id: string;
  profile_id: string;
  profile?: { id: string; name: string; role: string; avatar: string } | null;
  issued_by: string;
  issuer?: { id: string; name: string } | null;
  subject: string;
  category: StaffQueryCategory;
  status: StaffQueryStatus;
  due_date: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface StaffQueryMessage {
  id: string;
  query_id: string;
  author_id: string;
  author?: { id: string; name: string; avatar: string } | null;
  body: string;
  created_at: string;
}

// staff_queries has three FKs into profiles — name each relationship
// explicitly, same reason attendance.ts and leave.ts do this.
const QUERY_SELECT = '*, profile:profiles!staff_queries_profile_id_fkey(id,name,role,avatar), issuer:profiles!staff_queries_issued_by_fkey(id,name)';
const MESSAGE_SELECT = '*, author:profiles!staff_query_messages_author_id_fkey(id,name,avatar)';

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getStaffQueries(params?: { profileId?: string; status?: StaffQueryStatus }): Promise<StaffQuery[]> {
  if (!isSupabaseConfigured) return [];
  let query = db.from('staff_queries').select(QUERY_SELECT).order('created_at', { ascending: false });
  if (params?.profileId) query = query.eq('profile_id', params.profileId);
  if (params?.status) query = query.eq('status', params.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as StaffQuery[] | null) ?? [];
}

export async function getMyStaffQueries(): Promise<StaffQuery[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  return getStaffQueries({ profileId: uid });
}

export async function getQueryMessages(queryId: string): Promise<StaffQueryMessage[]> {
  if (!isSupabaseConfigured || !queryId) return [];
  const { data, error } = await db
    .from('staff_query_messages')
    .select(MESSAGE_SELECT)
    .eq('query_id', queryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as StaffQueryMessage[] | null) ?? [];
}

// Sequential insert: the header row, then the opening message. Not a
// transaction (no RPC exists for this pair), but leaving an orphaned header
// with no opening message on a mid-request failure is a safe, visible
// partial state — not silent data loss.
export async function issueStaffQuery(input: {
  profileId: string;
  subject: string;
  category: StaffQueryCategory;
  dueDate?: string;
  body: string;
}): Promise<StaffQuery> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const issuedBy = await currentUserId();
  if (!issuedBy) throw new Error('Not authenticated');
  const { data: query, error: queryError } = await db
    .from('staff_queries')
    .insert({
      profile_id: input.profileId,
      issued_by: issuedBy,
      subject: input.subject.trim(),
      category: input.category,
      due_date: input.dueDate || null,
    })
    .select(QUERY_SELECT)
    .single();
  if (queryError) throw queryError;

  const { error: messageError } = await db
    .from('staff_query_messages')
    .insert({ query_id: (query as StaffQuery).id, author_id: issuedBy, body: input.body.trim() });
  if (messageError) throw messageError;

  return query as StaffQuery;
}

export async function postQueryMessage(queryId: string, body: string): Promise<StaffQueryMessage> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const authorId = await currentUserId();
  if (!authorId) throw new Error('Not authenticated');
  const { data, error } = await db
    .from('staff_query_messages')
    .insert({ query_id: queryId, author_id: authorId, body: body.trim() })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return data as StaffQueryMessage;
}

export async function closeStaffQuery(id: string): Promise<StaffQuery> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const closedBy = await currentUserId();
  const { data, error } = await db
    .from('staff_queries')
    .update({ status: 'closed', closed_by: closedBy, closed_at: new Date().toISOString() })
    .eq('id', id)
    .select(QUERY_SELECT)
    .single();
  if (error) throw error;
  return data as StaffQuery;
}

export async function reopenStaffQuery(id: string): Promise<StaffQuery> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { data, error } = await db
    .from('staff_queries')
    .update({ status: 'open', closed_by: null, closed_at: null })
    .eq('id', id)
    .select(QUERY_SELECT)
    .single();
  if (error) throw error;
  return data as StaffQuery;
}
