import { isSupabaseConfigured, db, supabase } from '@/services/supabase';

export const STAFF_DOCUMENTS_BUCKET = 'staff-documents';

export type StaffDocumentCategory = 'contract' | 'id' | 'certificate' | 'performance' | 'disciplinary' | 'payroll' | 'other';

export interface StaffDocument {
  id: string;
  profile_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  category: StaffDocumentCategory;
  title: string | null;
  notes: string | null;
  confidential: boolean;
  uploaded_by: string | null;
  created_at: string;
}

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getStaffDocuments(profileId: string): Promise<StaffDocument[]> {
  if (!isSupabaseConfigured || !profileId) return [];
  const { data, error } = await db
    .from('staff_documents')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as StaffDocument[] | null) ?? [];
}

export async function uploadStaffDocument(profileId: string, file: File, meta: {
  category: StaffDocumentCategory;
  title?: string;
  notes?: string;
  confidential?: boolean;
}): Promise<StaffDocument> {
  if (!isSupabaseConfigured) throw new Error('Not connected to Supabase');
  const filePath = `${profileId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(STAFF_DOCUMENTS_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const uploaderId = await currentUserId();
  const { data, error } = await db
    .from('staff_documents')
    .insert({
      profile_id: profileId,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      category: meta.category,
      title: meta.title?.trim() || null,
      notes: meta.notes?.trim() || null,
      confidential: meta.confidential ?? false,
      uploaded_by: uploaderId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as StaffDocument;
}

export async function deleteStaffDocument(id: string, filePath: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await db.from('staff_documents').delete().eq('id', id);
  if (error) throw error;
  await supabase.storage.from(STAFF_DOCUMENTS_BUCKET).remove([filePath]);
}

// staff-documents is a private bucket — mint short-lived signed URLs at
// display time, same as getSignedMediaUrls in services/repairs.ts.
export async function getSignedStaffDocumentUrls(paths: string[], expiresIn = 600): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!isSupabaseConfigured || unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(STAFF_DOCUMENTS_BUCKET).createSignedUrls(unique, expiresIn);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  }
  return map;
}
