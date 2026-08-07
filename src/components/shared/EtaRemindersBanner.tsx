import { CalendarClock, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEtaReminders } from '@/hooks/useEtaReminders';
import { usePagination } from '@/hooks/usePagination';
import type { Repair } from '@/types/repair';

const PAGE_SIZE = 5;

interface Props {
  repairs: Repair[];
  onSelect?: (ticketNumber: string) => void;
}

function fmtEta(etaDate: string, tier: 'due_soon' | 'overdue'): string {
  if (tier === 'overdue') {
    const days = Math.round((Date.now() - new Date(`${etaDate}T00:00`).getTime()) / 86_400_000);
    return `${days}d overdue`;
  }
  const today = new Date().toISOString().slice(0, 10);
  return etaDate === today ? 'Due today' : 'Due tomorrow';
}

export default function EtaRemindersBanner({ repairs, onSelect }: Props) {
  const reminders = useEtaReminders(repairs);
  const { page, setPage, paginated, totalPages, total, from, to } = usePagination(reminders, PAGE_SIZE, reminders.length);
  if (reminders.length === 0) return null;

  const overdueCount = reminders.filter(r => r.tier === 'overdue').length;

  return (
    <div className="rounded-xl border p-4 space-y-3"
      style={{ background: 'hsl(266 55% 10%)', borderColor: 'hsl(266 45% 26%)' }}>
      <div className="flex items-center gap-2">
        <CalendarClock className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(266 75% 75%)' }} />
        <p className="text-sm font-semibold" style={{ color: 'hsl(266 75% 82%)' }}>
          {reminders.length} customer update{reminders.length > 1 ? 's' : ''} due
          {overdueCount > 0 && ` (${overdueCount} overdue)`}
        </p>
      </div>
      <div className="space-y-2">
        {paginated.map(({ repair, tier }) => {
          const overdue = tier === 'overdue';
          const Row = onSelect ? 'button' : 'div';
          return (
            <Row
              key={repair.id}
              {...(onSelect ? { onClick: () => onSelect(repair.id) } : {})}
              className={`w-full flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5 text-left ${onSelect ? 'cursor-pointer' : ''}`}
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs font-semibold" style={{ color: 'hsl(266 60% 92%)' }}>
                  {repair.id} · {repair.device} · {repair.customer}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(266 35% 68%)' }}>
                  {repair.etaDate && fmtEta(repair.etaDate, tier)}
                </p>
              </div>
              {repair.customerPhone && (
                <a href={`tel:${repair.customerPhone}`}
                  onClick={e => e.stopPropagation()}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'hsl(266 60% 88%)' }}>
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                style={overdue
                  ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                  : { background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}
              >
                {overdue ? 'OVERDUE' : 'DUE SOON'}
              </span>
            </Row>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'hsl(266 35% 65%)' }}>{from}–{to} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(266 60% 88%)' }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(266 60% 88%)' }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
