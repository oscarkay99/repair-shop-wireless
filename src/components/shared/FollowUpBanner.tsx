import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { getOpenFollowUps, type FollowUpNotice } from '@/services/wireless/ticketComments';

interface Props {
  /** Opens the ticket; ticket numbers as shown on the card (TK-0085). */
  onSelect?: (ticketNumber: string) => void;
  /** Bump to refetch, e.g. after the ticket list reloads. */
  refreshKey?: unknown;
}

function ago(iso: string): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Shown to the assigned technician when reception chases a ticket that has gone quiet. */
export default function FollowUpBanner({ onSelect, refreshKey }: Props) {
  const [notices, setNotices] = useState<FollowUpNotice[]>([]);

  useEffect(() => {
    let cancelled = false;
    getOpenFollowUps().then(n => { if (!cancelled) setNotices(n); }).catch(() => { /* banner is best-effort */ });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (notices.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-2"
      style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.35)' }}>
      <div className="flex items-center gap-2">
        <BellRing className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
        <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
          Reception is chasing {notices.length} of your ticket{notices.length > 1 ? 's' : ''}
        </p>
      </div>
      {notices.map(n => (
        <div key={n.commentId}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={onSelect ? () => onSelect(n.ticketNumber) : undefined}
          onKeyDown={onSelect ? e => { if (e.key === 'Enter') onSelect(n.ticketNumber); } : undefined}
          className={`rounded-lg px-3 py-2 ${onSelect ? 'cursor-pointer' : ''}`}
          style={{ background: 'hsl(var(--card))' }}>
          <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {n.ticketNumber} · {n.device} · {n.customerName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {n.requestedBy} followed up {ago(n.createdAt)}. Update the status or add a note to clear this.
          </p>
        </div>
      ))}
    </div>
  );
}
