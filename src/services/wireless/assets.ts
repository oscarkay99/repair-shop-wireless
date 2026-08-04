import { isSupabaseConfigured, db } from '@/services/supabase';

export type AssetStatus = 'active' | 'under_repair' | 'disposed';

export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchase_date: string | null;
  purchase_cost: number;
  current_value: number;
  status: AssetStatus;
  location: string | null;
  notes: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getFixedAssets(): Promise<FixedAsset[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db.from('fixed_assets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FixedAsset[] | null) ?? [];
}

export async function createFixedAsset(input: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<FixedAsset> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db.from('fixed_assets').insert(input).select().single();
  if (error) throw error;
  return data as FixedAsset;
}

export async function updateFixedAsset(id: string, patch: Partial<Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<FixedAsset> {
  if (!isSupabaseConfigured) throw new Error('Not configured');
  const { data, error } = await db.from('fixed_assets').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as FixedAsset;
}

export async function deleteFixedAsset(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('fixed_assets').delete().eq('id', id);
  if (error) throw error;
}
