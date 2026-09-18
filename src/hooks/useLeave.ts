import { useState, useEffect, useCallback } from 'react';
import {
  getLeaveTypes,
  getMyLeaveBalances,
  getMyLeaveRequests,
  getLeaveBalances,
  getLeaveRequests,
  createLeaveRequest,
  cancelLeaveRequest,
  decideLeaveRequest,
  upsertLeaveBalance,
  type LeaveType,
  type LeaveBalance,
  type LeaveRequest,
} from '@/services/wireless/leave';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

// Self-service: the logged-in user's own balances + request history, plus
// the ability to request/cancel their own leave.
export function useMyLeave() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    setLoading(true);
    return Promise.all([getLeaveTypes(), getMyLeaveBalances(), getMyLeaveRequests()])
      .then(([t, b, r]) => { setTypes(t); setBalances(b); setRequests(r); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const request = async (input: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) => {
    try {
      const created = await createLeaveRequest(input);
      setRequests(prev => [created, ...prev]);
      showToast('Leave request submitted');
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to submit leave request'), 'error');
      throw e;
    }
  };

  const cancel = async (id: string) => {
    try {
      const updated = await cancelLeaveRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast('Leave request cancelled');
    } catch (e) {
      showToast(errMessage(e, 'Failed to cancel leave request'), 'error');
      throw e;
    }
  };

  return { types, balances, requests, loading, refresh, request, cancel };
}

// HR/manager: all requests (optionally filtered to one staff member),
// approve/reject, and balance adjustments.
export function useLeaveApprovals(params?: { profileId?: string; status?: LeaveRequest['status'] }) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const profileId = params?.profileId;
  const status = params?.status;

  const refresh = useCallback(() => {
    setLoading(true);
    return Promise.all([getLeaveTypes(), getLeaveRequests({ profileId, status })])
      .then(([t, r]) => { setTypes(t); setRequests(r); })
      .finally(() => setLoading(false));
  }, [profileId, status]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async (id: string, note?: string) => {
    try {
      const updated = await decideLeaveRequest(id, { status: 'approved', note });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast('Leave request approved');
    } catch (e) {
      showToast(errMessage(e, 'Failed to approve leave request'), 'error');
      throw e;
    }
  };

  const reject = async (id: string, note?: string) => {
    try {
      const updated = await decideLeaveRequest(id, { status: 'rejected', note });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast('Leave request rejected');
    } catch (e) {
      showToast(errMessage(e, 'Failed to reject leave request'), 'error');
      throw e;
    }
  };

  const fileOnBehalf = async (input: { profileId: string; leaveTypeId: string; startDate: string; endDate: string; reason?: string }) => {
    try {
      const created = await createLeaveRequest(input);
      setRequests(prev => [created, ...prev]);
      showToast('Leave request filed');
      return created;
    } catch (e) {
      showToast(errMessage(e, 'Failed to file leave request'), 'error');
      throw e;
    }
  };

  const setBalance = async (input: { profileId: string; leaveTypeId: string; year: number; entitledDays?: number; carriedOverDays?: number }) => {
    try {
      await upsertLeaveBalance(input);
      showToast('Leave balance updated');
    } catch (e) {
      showToast(errMessage(e, 'Failed to update leave balance'), 'error');
      throw e;
    }
  };

  return { types, requests, loading, refresh, approve, reject, fileOnBehalf, setBalance };
}

export function useStaffLeaveBalances(profileId: string | undefined) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!profileId) { setBalances([]); setLoading(false); return Promise.resolve(); }
    setLoading(true);
    return getLeaveBalances(profileId).then(setBalances).finally(() => setLoading(false));
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balances, loading, refresh };
}
