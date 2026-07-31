import { isSupabaseConfigured, db } from '@/services/supabase';

export interface MyNotificationRow {
  id: string;
  action: string;
  table_name: string;
  entity_id: string | null;
  actor_name: string | null;
  created_at: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
}

export async function getMyNotifications(limit = 30): Promise<MyNotificationRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db.rpc('get_my_notifications', { p_limit: limit });
  if (error) throw error;
  return (data as MyNotificationRow[] | null) ?? [];
}
