import { isSupabaseConfigured, db } from '@/services/supabase';

export interface AttendanceRecord {
  id: string;
  profile_id: string;
  profile?: { id: string; name: string; role: string } | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

// attendance has two FKs into profiles (profile_id and recorded_by) — the
// relationship must be named explicitly or PostgREST can't disambiguate
// which one to embed and returns 300 Multiple Choices for every request.
const SELECT = '*, profile:profiles!attendance_profile_id_fkey(id,name,role)';

export async function getAttendance(params?: { from?: string; to?: string }): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) return [];
  let query = db.from('attendance').select(SELECT).order('clock_in', { ascending: false });
  if (params?.from) query = query.gte('clock_in', params.from);
  if (params?.to) query = query.lte('clock_in', params.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AttendanceRecord[] | null) ?? [];
}

export async function getOpenSession(profileId: string): Promise<AttendanceRecord | null> {
  if (!isSupabaseConfigured || !profileId) return null;
  const { data, error } = await db
    .from('attendance')
    .select(SELECT)
    .eq('profile_id', profileId)
    .is('clock_out', null)
    .maybeSingle();
  if (error) throw error;
  return data as AttendanceRecord | null;
}

export async function clockIn(profileId: string): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db
    .from('attendance')
    .insert({ profile_id: profileId })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function clockOut(id: string): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db
    .from('attendance')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function createAttendanceRecord(input: {
  profileId: string;
  clockIn: string;
  clockOut?: string | null;
  notes?: string;
}): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db
    .from('attendance')
    .insert({
      profile_id: input.profileId,
      clock_in: input.clockIn,
      clock_out: input.clockOut ?? null,
      notes: input.notes || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function updateAttendanceRecord(id: string, changes: {
  clockIn?: string;
  clockOut?: string | null;
  notes?: string;
}): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const patch: Record<string, unknown> = {};
  if (changes.clockIn !== undefined) patch.clock_in = changes.clockIn;
  if (changes.clockOut !== undefined) patch.clock_out = changes.clockOut;
  if (changes.notes !== undefined) patch.notes = changes.notes || null;
  const { data, error } = await db
    .from('attendance')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('attendance').delete().eq('id', id);
  if (error) throw error;
}
