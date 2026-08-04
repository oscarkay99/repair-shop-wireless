import { useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';
import { useAuth } from '@/hooks/useAuth';
import AttendanceTab from './AttendanceTab';

export default function AttendancePage() {
  const { setPageTitle } = usePageTitle();
  const { user } = useAuth();
  // Admin is a protected system role that can't carry a DB-seeded
  // attendance:manage permission — mirrors the same check used in
  // src/utils/access.ts and the (now-removed) Technicians Attendance tab.
  const canManage = user?.role === 'admin' || !!user?.permissions?.includes('attendance:manage');

  useEffect(() => {
    setPageTitle({ title: 'Attendance', subtitle: 'Clock-in/out log for every staff member', hideDefaultAction: true });
    return () => setPageTitle({ title: 'Dashboard' });
  }, [setPageTitle]);

  return <AttendanceTab canManage={canManage} />;
}
