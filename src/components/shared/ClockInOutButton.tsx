import { Clock } from 'lucide-react';
import { useClockInOut } from '@/hooks/useClockInOut';

export default function ClockInOutButton() {
  const { openSession, loaded, busy, clockIn, clockOut } = useClockInOut();
  if (!loaded) return null;

  return (
    <button
      onClick={openSession ? clockOut : clockIn}
      disabled={busy}
      className="h-8 px-3 flex items-center gap-1.5 rounded-md text-xs font-semibold text-white cursor-pointer disabled:opacity-50 flex-shrink-0"
      style={{ background: openSession ? '#ef4444' : '#22c55e' }}
      title={openSession
        ? `Clocked in at ${new Date(openSession.clock_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : 'Not clocked in'}
    >
      <Clock className="w-3.5 h-3.5" />
      {busy ? '…' : openSession ? 'Clock Out' : 'Clock In'}
    </button>
  );
}
