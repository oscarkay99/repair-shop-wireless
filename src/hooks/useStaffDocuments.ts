import { useState, useEffect, useCallback } from 'react';
import {
  getStaffDocuments,
  uploadStaffDocument,
  deleteStaffDocument,
  getSignedStaffDocumentUrls,
  type StaffDocument,
  type StaffDocumentCategory,
} from '@/services/wireless/staffDocuments';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useStaffDocuments(profileId: string | undefined) {
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    if (!profileId) { setDocuments([]); setLoading(false); return Promise.resolve(); }
    setLoading(true);
    return getStaffDocuments(profileId)
      .then(async docs => {
        setDocuments(docs);
        setSignedUrls(await getSignedStaffDocumentUrls(docs.map(d => d.file_path)));
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = async (file: File, meta: { category: StaffDocumentCategory; title?: string; notes?: string; confidential?: boolean }) => {
    if (!profileId) return;
    try {
      const created = await uploadStaffDocument(profileId, file, meta);
      setDocuments(prev => [created, ...prev]);
      const urls = await getSignedStaffDocumentUrls([created.file_path]);
      setSignedUrls(prev => ({ ...prev, ...urls }));
      showToast('Document uploaded');
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to upload document'), 'error');
      throw e;
    }
  };

  const remove = async (doc: StaffDocument) => {
    try {
      await deleteStaffDocument(doc.id, doc.file_path);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      showToast('Document deleted');
    } catch (e) {
      showToast(errMessage(e, 'Failed to delete document'), 'error');
      throw e;
    }
  };

  return { documents, signedUrls, loading, refresh, upload, remove };
}
