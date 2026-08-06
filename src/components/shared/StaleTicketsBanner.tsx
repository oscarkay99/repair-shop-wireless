import { Clock } from 'lucide-react';
import type { Repair } from '@/types/repair';
import { useStaleTickets } from '@/hooks/useStaleTickets';

interface Props {
  repairs: Repair[];
  /** RepairsBoard can open the detail panel on click; pages without one just omit this. */
  onSelect?: (ticketNumber: string) => void;
}

function formatQuiet(hours: number): string {
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function StaleTicketsBanner({ repairs, onSelect }: Props) {
  const stale = useStaleTickets(repairs);
  if (stale.length === 0) return null;

  const urgentCount = stale.filter(s => s.tier === 'urgent').length;

  return (
    <div className="rounded-xl border p-4 space-y-3"
      style={{ background: 'hsl(217 60% 8%)', borderColor: 'hsl(217 50% 22%)' }}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(210 80% 65%)' }} />
        <p className="text-sm font-semibold" style={{ color: 'hsl(210 80% 75%)' }}>
          {stale.length} ticket{stale.length > 1 ? 's' : ''} gone quiet
          {urgentCount > 0 && ` — ${urgentCount} over 3 days`}
        </p>
      </div>
      <div className="space-y-2">
        {stale.map(({ repair, tier, hoursSinceUpdate }) => {
          const urgent = tier === 'urgent';
          const Row = onSelect ? 'button' : 'div';
          return (
            <Row
              key={repair.id}
              {...(onSelect ? { onClick: () => onSelect(repair.id) } : {})}
              className={`w-full flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5 text-left ${onSelect ? 'cursor-pointer' : ''}`}
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs font-semibold" style={{ color: 'hsl(210 70% 92%)' }}>
                  {repair.id} · {repair.device} · {repair.customer}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(210 40% 65%)' }}>
                  No activity for {formatQuiet(hoursSinceUpdate)}
                </p>
              </div>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                style={urgent
                  ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                  : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
              >
                {urgent ? 'FOLLOW UP' : 'CHECK IN'}
              </span>
            </Row>
          );
        })}
      </div>
    </div>
  );
}
