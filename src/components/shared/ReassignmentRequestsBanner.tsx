import { useState } from 'react';
import { Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReassignmentRequest } from '@/services/wireless/ticketComments';
import { usePagination } from '@/hooks/usePagination';

const PAGE_SIZE = 5;

interface TechOption { id: string; name: string }

interface Props {
  requests: ReassignmentRequest[];
  technicians: TechOption[];
  /** Actually moves the ticket to the new technician — caller supplies this since Reception and the main Tickets board each already have their own reassign function. */
  onReassign: (ticketId: string, tech: TechOption) => Promise<unknown>;
  onResolve: (commentId: string) => Promise<unknown>;
}

export default function ReassignmentRequestsBanner({ requests, technicians, onReassign, onResolve }: Props) {
  const [picking, setPicking] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const { page, setPage, paginated, totalPages, total, from, to } = usePagination(requests, PAGE_SIZE, requests.length);

  if (requests.length === 0) return null;

  const handleReassign = async (req: ReassignmentRequest) => {
    const techId = picking[req.commentId];
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;
    setBusyId(req.commentId);
    try {
      // patchRepair/updateRepair key off ticket_number ("TK-0036"), not the
      // tickets.id UUID that req.ticketId carries — using ticketId here
      // threw "Repair not found." on every reassign attempt.
      await onReassign(req.ticketNumber, tech);
      await onResolve(req.commentId);
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (req: ReassignmentRequest) => {
    setBusyId(req.commentId);
    try { await onResolve(req.commentId); }
    finally { setBusyId(null); }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3"
      style={{ background: 'hsl(38 70% 8%)', borderColor: 'hsl(38 60% 20%)' }}>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--status-pending))' }} />
        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--status-pending))' }}>
          {requests.length} reassignment request{requests.length > 1 ? 's' : ''} waiting on you
        </p>
      </div>
      <div className="space-y-2">
        {paginated.map(req => (
          <div key={req.commentId} className="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(0,0,0,0.15)' }}>
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-semibold" style={{ color: 'hsl(38 80% 92%)' }}>
                {req.ticketNumber} · {req.device} · {req.customerName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(38 60% 65%)' }}>
                {req.requestedBy}: "{req.reason}"
              </p>
            </div>
            <select
              value={picking[req.commentId] ?? ''}
              onChange={e => setPicking(prev => ({ ...prev, [req.commentId]: e.target.value }))}
              className="h-8 px-2.5 rounded-lg text-xs outline-none"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              <option value="">Reassign to…</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={() => handleReassign(req)} disabled={!picking[req.commentId] || busyId === req.commentId}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: 'hsl(var(--primary))' }}>
              {busyId === req.commentId ? '…' : 'Reassign'}
            </button>
            <button onClick={() => handleDismiss(req)} disabled={busyId === req.commentId}
              title="Mark handled without reassigning"
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40"
              style={{ color: 'hsl(38 60% 65%)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'hsl(38 60% 60%)' }}>{from}–{to} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(38 80% 85%)' }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(38 80% 85%)' }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
