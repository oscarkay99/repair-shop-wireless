import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOpenSession, clockIn as clockInSvc, clockOut as clockOutSvc } from '@/services/wireless/attendance';
import type { AttendanceRecord } from '@/services/wireless/attendance';

/** Self-service clock in/out for whoever is currently logged in — every staff role, not just technicians. */
export function useClockInOut() {
  const { user } = useAuth();
  const [openSession, setOpenSession] = useState<AttendanceRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoaded(true); return; }
    getOpenSession(user.id).then(setOpenSession).catch(() => setOpenSession(null)).finally(() => setLoaded(true));
  }, [user?.id]);

  const clockIn = async () => {
    if (!user?.id || busy) return;
    setBusy(true);
    try { setOpenSession(await clockInSvc(user.id)); }
    finally { setBusy(false); }
  };

  const clockOut = async () => {
    if (!openSession || busy) return;
    setBusy(true);
    try { await clockOutSvc(openSession.id); setOpenSession(null); }
    finally { setBusy(false); }
  };

  return { openSession, loaded, busy, clockIn, clockOut };
}
