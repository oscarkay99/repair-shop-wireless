import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import AttendanceTab from './AttendanceTab';

export default function AttendancePage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  // HR owns normal attendance corrections; Admin retains emergency override.
  // Manager and every other operational role are denied by AuthGuard and RLS.
  const canManage = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    setPageTitle({ title: 'Attendance', subtitle: 'Technician clock-in/out history and audited corrections', hideDefaultAction: true });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return <AttendanceTab canManage={canManage} />;
}
