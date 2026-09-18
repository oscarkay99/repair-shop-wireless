import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryThread } from '@/hooks/useStaffQueries';
import type { StaffQuery } from '@/services/wireless/staffQueries';

const STATUS_STYLE: Record<StaffQuery['status'], { label: string; bg: string; fg: string }> = {
  open: { label: 'Awaiting Response', bg: 'rgba(245,158,11,0.12)', fg: '#B45309' },
  responded: { label: 'Responded — Awaiting Review', bg: 'rgba(59,130,246,0.12)', fg: '#1D4ED8' },
  closed: { label: 'Closed', bg: 'rgba(100,116,139,0.12)', fg: '#475569' },
};

interface Props {
  query: StaffQuery;
  canManage: boolean;
  onClose?: () => Promise<void>;
  onReopen?: () => Promise<void>;
}

// Reused by both HR's StaffQueriesTab/AllQueriesSection and the staff
// self-service "My Queries" panel on the Profile page — the staff member
// reply box and the HR follow-up box are the same UI, just gated
// differently below.
export default function QueryThread({ query, canManage, onClose, onReopen }: Props) {
  const { user } = useAuth();
  const { messages, loading, reply } = useQueryThread(query.id);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const isOwner = user?.id === query.profile_id;
  const canReply = query.status !== 'closed' && (isOwner || canManage);
  const status = STATUS_STYLE[query.status];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try { await reply(body); setBody(''); } finally { setSending(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="p-4 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{query.subject}</p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {query.category.charAt(0).toUpperCase() + query.category.slice(1)}
            {query.due_date && ` · Due ${new Date(query.due_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap" style={{ background: status.bg, color: status.fg }}>
            {status.label}
          </span>
          {canManage && query.status !== 'closed' && onClose && (
            <button onClick={onClose} className="text-xs font-semibold px-3 h-7 rounded-lg whitespace-nowrap"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Close Query
            </button>
          )}
          {canManage && query.status === 'closed' && onReopen && (
            <button onClick={onReopen} className="text-xs font-semibold px-3 h-7 rounded-lg whitespace-nowrap"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>No messages yet</p>
        ) : messages.map(m => {
          const fromStaff = m.author_id === query.profile_id;
          return (
            <div key={m.id} className={`flex ${fromStaff ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[80%] rounded-xl px-3 py-2"
                style={{ background: fromStaff ? 'hsl(var(--muted))' : 'rgba(236,1,24,0.08)' }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: fromStaff ? 'hsl(var(--muted-foreground))' : '#EC0118' }}>
                  {m.author?.name ?? (fromStaff ? 'Staff' : 'HR')}
                </p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground))' }}>{m.body}</p>
                <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {canReply ? (
        <form onSubmit={handleSend} className="p-4 pt-0 flex gap-2">
          <input type="text" value={body} onChange={e => setBody(e.target.value)}
            placeholder={isOwner ? 'Write your response…' : 'Write a follow-up…'}
            className="flex-1 h-9 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
          <button type="submit" disabled={sending || !body.trim()}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white disabled:opacity-50 whitespace-nowrap"
            style={{ background: 'hsl(var(--primary))' }}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {query.status === 'closed' ? 'This query is closed.' : 'You can view this thread but not reply.'}
          </p>
        </div>
      )}
    </div>
  );
}
