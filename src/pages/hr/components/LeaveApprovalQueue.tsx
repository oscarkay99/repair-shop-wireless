import { useLeaveApprovals } from '@/hooks/useLeave';

export default function LeaveApprovalQueue() {
  const { types, requests, loading, approve, reject } = useLeaveApprovals({ status: 'pending' });

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Pending Leave Requests ({requests.length})</p>

      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <i className="ri-checkbox-circle-line text-2xl mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Nothing pending — all caught up</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(r => {
            const type = types.find(t => t.id === r.leave_type_id);
            return (
              <div key={r.id} className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#EC0118' }}>
                    {r.profile?.avatar ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{r.profile?.name ?? 'Staff'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {type?.label ?? r.leave_type_id} · {r.days_requested} day{r.days_requested !== 1 ? 's' : ''} ·{' '}
                      {new Date(r.start_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(r.end_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {r.reason && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>"{r.reason}"</p>}
                  </div>
                </div>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
