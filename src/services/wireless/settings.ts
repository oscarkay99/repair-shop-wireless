import { isSupabaseConfigured, db, supabase } from '@/services/supabase';
import type { WirelessSettings } from '@/types/wireless';

const LOGO_BUCKET = 'branding';

const DEFAULT: WirelessSettings = {
  id: 'store',
  business_name: 'WIRELESS',
  tagline: 'Repair & Service',
  phone: '',
  whatsapp: '',
  address: '',
  monthly_target: 10000,
  vat_rate: 0,
  nhil_getfund_rate: 5,
  currency: 'GHS',
  warranty_days: 30,
  warranty_new_label: '12 Months',
  warranty_used_label: '3 Months',
  quote_validity_days: 7,
  low_stock_threshold: 2,
  repair_turnaround_target: 'Same Day',
  default_delivery_fee: 50,
  business_hours_mon_fri: '8:00 AM – 8:00 PM',
  business_hours_saturday: '9:00 AM – 7:00 PM',
  business_hours_sunday: 'Closed',
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

// Uploaded under a fresh, unique filename each time (rather than overwriting
// one fixed path) so the browser/CDN never serves a stale cached copy right
// after a change — same reasoning as the ticket-media upload path.
export async function uploadLogo(file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Uploading a logo requires a live Supabase connection.');
  // Strip to a short alphanumeric token before it becomes part of a
  // storage path — an unvalidated extension could otherwise let the
  // resulting key escape the bucket's flat namespace.
  const rawExt = file.name.includes('.') ? file.name.split('.').pop() ?? '' : '';
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'png';
  const filePath = `logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath).data.publicUrl;
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
