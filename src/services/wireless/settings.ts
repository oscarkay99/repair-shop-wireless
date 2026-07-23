import { isSupabaseConfigured, db } from '@/services/supabase';
import type { WirelessSettings } from '@/types/wireless';

const DEFAULT: WirelessSettings = {
  id: 'store',
  business_name: 'WIRELESS',
  tagline: 'Repair & Service',
  phone: '',
  whatsapp: '',
  address: '',
  monthly_target: 10000,
  vat_rate: 0,
  currency: 'GH₵',
  warranty_days: 30,
  primary_color: '#EC0118',
  tax_enabled: true,
  updated_at: new Date().toISOString(),
};
let localSettings: WirelessSettings = { ...DEFAULT };

export async function getWirelessSettings(): Promise<WirelessSettings> {
  if (!isSupabaseConfigured) return { ...localSettings };
  try {
    const { data, error } = await db.from('settings').select('*').eq('id', 'store').single();
    if (error) throw error;
    if (data) { localSettings = data as WirelessSettings; }
    return localSettings;
  } catch (e) {
    console.warn('[wireless/settings] falling back to local store', e);
    return { ...localSettings };
  }
}

export async function updateWirelessSettings(patch: Partial<WirelessSettings>): Promise<WirelessSettings> {
  const next = { ...localSettings, ...patch, updated_at: new Date().toISOString() };
  if (isSupabaseConfigured) {
    const { error } = await db.from('settings').upsert({ ...next, id: 'store' });
    if (error) throw error;
  }
  localSettings = next;
  return { ...localSettings };
}
