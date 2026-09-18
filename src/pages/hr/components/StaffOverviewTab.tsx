import { useEffect, useState } from 'react';
import { roleLabels, roleColors } from '@/mocks/users';
import { useStaffLeaveBalances } from '@/hooks/useLeave';
import { useStaffQueries } from '@/hooks/useStaffQueries';
import { getAttendance, type AttendanceRecord } from '@/services/wireless/attendance';
import type { WirelessProfile } from '@/services/wireless/users';

interface Props {
  staff: WirelessProfile;
}

export default function StaffOverviewTab({ staff }: Props) {
  const { balances } = useStaffLeaveBalances(staff.id);
  const { queries } = useStaffQueries({ profileId: staff.id });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    getAttendance({ profileId: staff.id }).then(rows => setRecentAttendance(rows.slice(0, 5))).catch(() => {});
  }, [staff.id]);

  const roleColor = roleColors[staff.role] ?? '#EC0118';
  const roleLabel = roleLabels[staff.role] ?? staff.role;
  const openQueries = queries.filter(q => q.status !== 'closed').length;
  const totalRemaining = balances.reduce((sum, b) => sum + (b.entitled_days + b.carried_over_days - b.used_days), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)` }}>
            {staff.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{staff.name}</p>
            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{staff.email}</p>
            <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: roleColor }}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{totalRemaining}</p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Leave Days Left</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <p className="text-lg font-bold" style={{ color: openQueries > 0 ? '#B45309' : 'hsl(var(--foreground))' }}>{openQueries}</p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Open Queries</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {staff.last_login ? new Date(staff.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Last Login</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Recent Attendance</p>
        </div>
        {recentAttendance.length === 0 ? (
          <p className="text-xs p-4 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>No attendance recorded yet</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {recentAttendance.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                  {new Date(a.clock_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {new Date(a.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {a.clock_out ? new Date(a.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
