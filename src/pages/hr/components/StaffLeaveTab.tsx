import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveApprovals, useStaffLeaveBalances } from '@/hooks/useLeave';
import LeaveRequestForm from '@/components/shared/LeaveRequestForm';
import type { LeaveRequest } from '@/services/wireless/leave';

const STATUS_STYLE: Record<LeaveRequest['status'], { bg: string; fg: string; label: string }> = {
  pending: { bg: 'rgba(245,158,11,0.12)', fg: '#B45309', label: 'Pending' },
  approved: { bg: 'rgba(34,197,94,0.12)', fg: '#15803D', label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.12)', fg: '#B91C1C', label: 'Rejected' },
  cancelled: { bg: 'rgba(100,116,139,0.12)', fg: '#475569', label: 'Cancelled' },
};

interface Props {
  profileId: string;
}

export default function StaffLeaveTab({ profileId }: Props) {
  const { user } = useAuth();
  const canManage = !!user?.permissions?.includes('leave:manage') || user?.role === 'admin';
  const { types, requests, loading, approve, reject, fileOnBehalf } = useLeaveApprovals({ profileId });
  const { balances } = useStaffLeaveBalances(profileId);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {balances.map(b => {
            const type = types.find(t => t.id === b.leave_type_id);
            const remaining = b.entitled_days + b.carried_over_days - b.used_days;
            return (
              <div key={b.id} className="rounded-xl p-3 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{remaining}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{type?.label ?? b.leave_type_id} left · {b.year}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Leave Requests ({requests.length})</p>
        {canManage && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#EC0118' }}>
            <i className="ri-calendar-event-line mr-1" /> File Leave
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <i className="ri-calendar-line text-2xl mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No leave requests yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(r => {
            const type = types.find(t => t.id === r.leave_type_id);
            const style = STATUS_STYLE[r.status];
            return (
              <div key={r.id} className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {type?.label ?? r.leave_type_id} · {r.days_requested} day{r.days_requested !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(r.start_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(r.end_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {r.reason && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>"{r.reason}"</p>}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0" style={{ background: style.bg, color: style.fg }}>
                    {style.label}
                  </span>
                </div>
                {canManage && r.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <button onClick={() => reject(r.id)}
                      className="flex-1 h-8 rounded-lg text-xs font-semibold"
                      style={{ background: 'hsl(var(--muted))', color: '#B91C1C' }}>
                      Reject
                    </button>
                    <button onClick={() => approve(r.id)}
                      className="flex-1 h-8 rounded-lg text-xs font-semibold text-white"
                      style={{ background: '#15803D' }}>
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <LeaveRequestForm
          types={types}
          onSave={(input) => fileOnBehalf({ profileId, ...input })}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
