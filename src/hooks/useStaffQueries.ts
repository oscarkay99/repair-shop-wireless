import { useState, useEffect, useCallback } from 'react';
import {
  getStaffQueries,
  getMyStaffQueries,
  getQueryMessages,
  issueStaffQuery,
  postQueryMessage,
  closeStaffQuery,
  reopenStaffQuery,
  type StaffQuery,
  type StaffQueryCategory,
  type StaffQueryStatus,
} from '@/services/wireless/staffQueries';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useStaffQueries(params?: { profileId?: string; status?: StaffQueryStatus; mine?: boolean }) {
  const [queries, setQueries] = useState<StaffQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const profileId = params?.profileId;
  const status = params?.status;
  const mine = params?.mine;

  const refresh = useCallback(() => {
    setLoading(true);
    const fetcher = mine ? getMyStaffQueries() : getStaffQueries({ profileId, status });
    return fetcher.then(setQueries).finally(() => setLoading(false));
  }, [profileId, status, mine]);

  useEffect(() => { refresh(); }, [refresh]);

  const issue = async (input: { profileId: string; subject: string; category: StaffQueryCategory; dueDate?: string; body: string }) => {
    try {
      const created = await issueStaffQuery(input);
      setQueries(prev => [created, ...prev]);
      showToast('Query issued');
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to issue query'), 'error');
      throw e;
    }
  };

  const close = async (id: string) => {
    try {
      const updated = await closeStaffQuery(id);
      setQueries(prev => prev.map(q => q.id === id ? updated : q));
      showToast('Query closed');
    } catch (e) {
      showToast(errMessage(e, 'Failed to close query'), 'error');
      throw e;
    }
  };

  const reopen = async (id: string) => {
    try {
      const updated = await reopenStaffQuery(id);
      setQueries(prev => prev.map(q => q.id === id ? updated : q));
      showToast('Query reopened');
    } catch (e) {
      showToast(errMessage(e, 'Failed to reopen query'), 'error');
      throw e;
    }
  };

  return { queries, loading, refresh, issue, close, reopen };
}

export function useQueryThread(queryId: string | undefined) {
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof getQueryMessages>>>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    if (!queryId) { setMessages([]); setLoading(false); return Promise.resolve(); }
    setLoading(true);
    return getQueryMessages(queryId).then(setMessages).finally(() => setLoading(false));
  }, [queryId]);

  useEffect(() => { refresh(); }, [refresh]);

  const reply = async (body: string) => {
    if (!queryId) return;
    try {
      const created = await postQueryMessage(queryId, body);
      setMessages(prev => [...prev, created]);
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to send reply'), 'error');
      throw e;
    }
  };

  return { messages, loading, refresh, reply };
}
