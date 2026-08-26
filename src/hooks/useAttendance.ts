import { useState, useEffect, useCallback } from 'react';
import {
  getAttendance,
  getOpenSessions,
  clockIn as clockInSvc,
  clockOut as clockOutSvc,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  type AttendanceRecord,
} from '@/services/wireless/attendance';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useAttendance(params?: { from?: string; to?: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [openSessions, setOpenSessions] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const from = params?.from;
  const to = params?.to;

  const refresh = useCallback(() => {
    setLoading(true);
    return Promise.all([getAttendance({ from, to }), getOpenSessions()])
      .then(([r, open]) => { setRecords(r); setOpenSessions(open); })
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { refresh(); }, [refresh]);

  // Only reachable by whoever has attendance:manage (admin/manager) —
  // staff no longer clock themselves in/out, see
  // 20260826040000_attendance_manager_only.sql.
  const clockInStaff = async (profileId: string) => {
    try {
      const created = await clockInSvc(profileId);
      setOpenSessions(prev => [created, ...prev]);
      setRecords(prev => [created, ...prev]);
      showToast(`${created.profile?.name ?? 'Staff'} clocked in`);
    } catch (e) {
      showToast(errMessage(e, 'Failed to clock in'), 'error');
      throw e;
    }
  };

  const clockOutStaff = async (recordId: string) => {
    try {
      const updated = await clockOutSvc(recordId);
      setOpenSessions(prev => prev.filter(r => r.id !== recordId));
      setRecords(prev => prev.map(r => r.id === recordId ? updated : r));
      showToast(`${updated.profile?.name ?? 'Staff'} clocked out`);
    } catch (e) {
      showToast(errMessage(e, 'Failed to clock out'), 'error');
      throw e;
    }
  };

  const add = async (input: { profileId: string; clockIn: string; clockOut?: string | null; notes?: string }) => {
    try {
      const created = await createAttendanceRecord(input);
      setRecords(prev => [created, ...prev]);
      if (!created.clock_out) setOpenSessions(prev => [created, ...prev]);
      showToast('Attendance recorded');
      return created;
    } catch (err) {
      showToast(errMessage(err, 'Failed to record attendance'), 'error');
      throw err;
    }
  };

  const update = async (id: string, changes: { clockIn?: string; clockOut?: string | null; notes?: string }) => {
    try {
      const updated = await updateAttendanceRecord(id, changes);
      setRecords(prev => prev.map(r => r.id === id ? updated : r));
      setOpenSessions(prev => updated.clock_out ? prev.filter(r => r.id !== id) : [updated, ...prev.filter(r => r.id !== id)]);
      showToast('Attendance updated');
    } catch (err) {
      showToast(errMessage(err, 'Failed to update attendance'), 'error');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteAttendanceRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      setOpenSessions(prev => prev.filter(r => r.id !== id));
      showToast('Attendance record deleted');
    } catch (err) {
      showToast(errMessage(err, 'Failed to delete attendance record'), 'error');
      throw err;
    }
  };

  return { records, openSessions, loading, refresh, add, update, remove, clockInStaff, clockOutStaff };
}
