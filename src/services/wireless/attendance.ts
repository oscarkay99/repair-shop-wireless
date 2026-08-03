import { isSupabaseConfigured, db } from '@/services/supabase';

export interface AttendanceRecord {
  id: string;
  technician_id: string;
  technician?: { id: string; name: string } | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAttendance(params?: { from?: string; to?: string }): Promise<AttendanceRecord[]> {
  if (!isSupabaseConfigured) return [];
  let query = db.from('attendance').select('*, technician:technicians(id,name)').order('clock_in', { ascending: false });
  if (params?.from) query = query.gte('clock_in', params.from);
  if (params?.to) query = query.lte('clock_in', params.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AttendanceRecord[] | null) ?? [];
}

export async function getOpenSession(technicianId: string): Promise<AttendanceRecord | null> {
  if (!isSupabaseConfigured || !technicianId) return null;
  const { data, error } = await db
    .from('attendance')
    .select('*, technician:technicians(id,name)')
    .eq('technician_id', technicianId)
    .is('clock_out', null)
    .maybeSingle();
  if (error) throw error;
  return data as AttendanceRecord | null;
}

export async function clockIn(technicianId: string): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db
    .from('attendance')
    .insert({ technician_id: technicianId })
    .select('*, technician:technicians(id,name)')
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
    .select('*, technician:technicians(id,name)')
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function createAttendanceRecord(input: {
  technicianId: string;
  clockIn: string;
  clockOut?: string | null;
  notes?: string;
}): Promise<AttendanceRecord> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db
    .from('attendance')
    .insert({
      technician_id: input.technicianId,
      clock_in: input.clockIn,
      clock_out: input.clockOut ?? null,
      notes: input.notes || null,
    })
    .select('*, technician:technicians(id,name)')
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
    .select('*, technician:technicians(id,name)')
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('attendance').delete().eq('id', id);
  if (error) throw error;
}
