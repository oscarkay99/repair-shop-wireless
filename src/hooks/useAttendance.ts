import { useState, useEffect, useCallback } from 'react';
import {
  getAttendance,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  type AttendanceRecord,
} from '@/services/wireless/attendance';
import { useToast } from '@/contexts/ToastContext';
import { errMessage } from '@/utils/errors';

export function useAttendance(params?: { from?: string; to?: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const from = params?.from;
  const to = params?.to;

  const refresh = useCallback(() => {
    setLoading(true);
    return getAttendance({ from, to }).then(setRecords).finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (input: { technicianId: string; clockIn: string; clockOut?: string | null; notes?: string }) => {
    try {
      const created = await createAttendanceRecord(input);
      setRecords(prev => [created, ...prev]);
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
      showToast('Attendance record deleted');
    } catch (err) {
      showToast(errMessage(err, 'Failed to delete attendance record'), 'error');
      throw err;
    }
  };

  return { records, loading, refresh, add, update, remove };
}
