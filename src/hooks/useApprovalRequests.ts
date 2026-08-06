import { useState, useEffect, useCallback } from 'react';
import { getPendingApprovalRequests, resolveApprovalRequest, type ApprovalRequest } from '@/services/wireless/ticketComments';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useApprovalRequests() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    setLoading(true);
    return getPendingApprovalRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const resolve = async (commentId: string, ticketId: string, decision: 'approved' | 'declined', authorName: string) => {
    try {
      await resolveApprovalRequest(commentId, ticketId, decision, authorName);
      setRequests(prev => prev.filter(r => r.commentId !== commentId));
    } catch (err) {
      showToast(errMessage(err, 'Failed to record the decision'), 'error');
      throw err;
    }
  };

  return { requests, loading, refresh, resolve };
}
