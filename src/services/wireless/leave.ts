import { isSupabaseConfigured, db, supabase } from '@/services/supabase';

export interface LeaveType {
  id: string;
  label: string;
  paid: boolean;
  color: string;
}

export interface LeaveBalance {
  id: string;
  profile_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  used_days: number;
  carried_over_days: number;
}

export interface LeaveRequest {
  id: string;
  profile_id: string;
  profile?: { id: string; name: string; role: string; avatar: string } | null;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
}

// leave_requests has two FKs into profiles (profile_id and decided_by) —
// name the relationship explicitly or PostgREST can't disambiguate which
// one to embed, same reason attendance.ts does this for recorded_by.
const REQUEST_SELECT = '*, profile:profiles!leave_requests_profile_id_fkey(id,name,role,avatar)';

export async function getLeaveTypes(): Promise<LeaveType[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db.from('leave_types').select('*').order('label');
  if (error) throw error;
  return (data as LeaveType[] | null) ?? [];
}

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getMyLeaveBalances(): Promise<LeaveBalance[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  return getLeaveBalances(uid);
}

export async function getLeaveBalances(profileId: string): Promise<LeaveBalance[]> {
  if (!isSupabaseConfigured || !profileId) return [];
  const { data, error } = await db
    .from('leave_balances')
    .select('*')
    .eq('profile_id', profileId)
    .order('year', { ascending: false });
  if (error) throw error;
  return (data as LeaveBalance[] | null) ?? [];
}

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  if (!isSupabaseConfigured) return [];
  const uid = await currentUserId();
  if (!uid) return [];
  return getLeaveRequests({ profileId: uid });
}

export async function getLeaveRequests(params?: { profileId?: string; status?: LeaveRequest['status'] }): Promise<LeaveRequest[]> {
  if (!isSupabaseConfigured) return [];
  let query = db.from('leave_requests').select(REQUEST_SELECT).order('start_date', { ascending: false });
  if (params?.profileId) query = query.eq('profile_id', params.profileId);
  if (params?.status) query = query.eq('status', params.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LeaveRequest[] | null) ?? [];
}

// profileId defaults to the caller — self-service. HR passes an explicit
// profileId to file leave on someone's behalf (still lands as 'pending';
// RLS lets leave:manage holders insert for anyone).
export async function createLeaveRequest(input: {
  profileId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<LeaveRequest> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const profileId = input.profileId ?? (await currentUserId());
  if (!profileId) throw new Error('Not authenticated');
  const { data, error } = await db
    .from('leave_requests')
    .insert({
      profile_id: profileId,
      leave_type_id: input.leaveTypeId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason?.trim() || null,
    })
    .select(REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data as LeaveRequest;
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const { data, error } = await db
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data as LeaveRequest;
}

export async function decideLeaveRequest(id: string, decision: {
  status: 'approved' | 'rejected';
  note?: string;
}): Promise<LeaveRequest> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const decidedBy = await currentUserId();
  const { data, error } = await db
    .from('leave_requests')
    .update({
      status: decision.status,
      decided_by: decidedBy,
      decided_at: new Date().toISOString(),
      decision_note: decision.note?.trim() || null,
    })
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data as LeaveRequest;
}

export async function upsertLeaveBalance(input: {
  profileId: string;
  leaveTypeId: string;
  year: number;
  entitledDays?: number;
  carriedOverDays?: number;
}): Promise<LeaveBalance> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const patch: Record<string, unknown> = {
    profile_id: input.profileId,
    leave_type_id: input.leaveTypeId,
    year: input.year,
  };
  if (input.entitledDays !== undefined) patch.entitled_days = input.entitledDays;
  if (input.carriedOverDays !== undefined) patch.carried_over_days = input.carriedOverDays;
  const { data, error } = await db
    .from('leave_balances')
    .upsert(patch, { onConflict: 'profile_id,leave_type_id,year' })
    .select('*')
    .single();
  if (error) throw error;
  return data as LeaveBalance;
}
