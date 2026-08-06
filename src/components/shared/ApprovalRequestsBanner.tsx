import { useState } from 'react';
import { AlertTriangle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApprovalRequest } from '@/services/wireless/ticketComments';
import { usePagination } from '@/hooks/usePagination';

const PAGE_SIZE = 5;

interface Props {
  requests: ApprovalRequest[];
  onResolve: (commentId: string, ticketId: string, decision: 'approved' | 'declined') => Promise<unknown>;
}

export default function ApprovalRequestsBanner({ requests, onResolve }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { page, setPage, paginated, totalPages, total, from, to } = usePagination(requests, PAGE_SIZE, requests.length);
  if (requests.length === 0) return null;

  const decide = async (req: ApprovalRequest, decision: 'approved' | 'declined') => {
    setBusyId(req.commentId);
    try { await onResolve(req.commentId, req.ticketId, decision); }
    finally { setBusyId(null); }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3"
      style={{ background: 'hsl(20 70% 9%)', borderColor: 'hsl(20 60% 24%)' }}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(20 85% 65%)' }} />
        <p className="text-sm font-semibold" style={{ color: 'hsl(20 85% 78%)' }}>
          {requests.length} extra-cost approval{requests.length > 1 ? 's' : ''} waiting on the customer
        </p>
      </div>
      <div className="space-y-2">
        {paginated.map(req => (
          <div key={req.commentId} className="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(0,0,0,0.15)' }}>
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-semibold" style={{ color: 'hsl(20 70% 92%)' }}>
                {req.ticketNumber} · {req.device} · {req.customerName}
                {req.amount != null && <span style={{ color: 'hsl(20 85% 70%)' }}> · +GHS {req.amount.toFixed(2)}</span>}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(20 45% 65%)' }}>
                {req.requestedBy}: "{req.reason}"
              </p>
            </div>
            <button onClick={() => decide(req, 'approved')} disabled={busyId === req.commentId}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: '#22c55e' }}>
              <Check className="w-3.5 h-3.5" /> Approved
            </button>
            <button onClick={() => decide(req, 'declined')} disabled={busyId === req.commentId}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              <X className="w-3.5 h-3.5" /> Declined
            </button>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'hsl(20 45% 60%)' }}>{from}–{to} of {total}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(20 85% 85%)' }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(20 85% 85%)' }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
