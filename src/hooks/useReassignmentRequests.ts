import { useState, useEffect, useCallback } from 'react';
import { getPendingReassignmentRequests, resolveReassignmentRequest, type ReassignmentRequest } from '@/services/wireless/ticketComments';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useReassignmentRequests() {
  const [requests, setRequests] = useState<ReassignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    setLoading(true);
    return getPendingReassignmentRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const resolve = async (commentId: string) => {
    try {
      await resolveReassignmentRequest(commentId);
      setRequests(prev => prev.filter(r => r.commentId !== commentId));
    } catch (err) {
      showToast(errMessage(err, 'Failed to update the request'), 'error');
      throw err;
    }
  };

  return { requests, loading, refresh, resolve };
}
