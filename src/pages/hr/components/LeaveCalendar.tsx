import { useMemo, useState } from 'react';
import { useLeaveApprovals } from '@/hooks/useLeave';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateOnly(iso: string): Date {
  return new Date(iso + 'T00:00');
}

export default function LeaveCalendar() {
  const { types, requests, loading } = useLeaveApprovals({ status: 'approved' });
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const leaveByDay = useMemo(() => {
    const map = new Map<string, { name: string; color: string }[]>();
    for (const r of requests) {
      const type = types.find(t => t.id === r.leave_type_id);
      const start = toDateOnly(r.start_date);
      const end = toDateOnly(r.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString();
        const entry = { name: r.profile?.name ?? 'Staff', color: type?.color ?? '#EC0118' };
        map.set(key, [...(map.get(key) ?? []), entry]);
      }
    }
    return map;
  }, [requests, types]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{monthLabel}</p>
        <div className="flex gap-2">
          <button onClick={() => setCursor(c => { const n = new Date(c); n.setMonth(n.getMonth() - 1); return n; })}
            className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <i className="ri-arrow-left-s-line" style={{ color: 'hsl(var(--foreground))' }} />
          </button>
          <button onClick={() => setCursor(c => { const n = new Date(c); n.setMonth(n.getMonth() + 1); return n; })}
            className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
            <i className="ri-arrow-right-s-line" style={{ color: 'hsl(var(--foreground))' }} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            {WEEKDAYS.map(w => (
              <div key={w} className="p-2 text-center text-[10px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              const entries = date ? leaveByDay.get(date.toDateString()) ?? [] : [];
              const isToday = date && date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="min-h-[76px] p-1.5" style={{ borderTop: i >= 7 ? '1px solid hsl(var(--border))' : undefined, borderLeft: i % 7 !== 0 ? '1px solid hsl(var(--border))' : undefined }}>
                  {date && (
                    <>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: isToday ? '#EC0118' : 'hsl(var(--muted-foreground))' }}>{date.getDate()}</p>
                      <div className="space-y-0.5">
                        {entries.slice(0, 2).map((e, idx) => (
                          <div key={idx} className="text-[9px] px-1 py-0.5 rounded truncate text-white" style={{ background: e.color }} title={e.name}>
                            {e.name.split(' ')[0]}
                          </div>
                        ))}
                        {entries.length > 2 && (
                          <p className="text-[9px]" style={{ color: 'hsl(var(--muted-foreground))' }}>+{entries.length - 2} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
