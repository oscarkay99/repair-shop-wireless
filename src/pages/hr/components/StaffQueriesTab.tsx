import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStaffQueries } from '@/hooks/useStaffQueries';
import IssueQueryModal from './IssueQueryModal';
import QueryThread from '@/components/shared/QueryThread';

interface Props {
  profileId: string;
  staffName: string;
}

export default function StaffQueriesTab({ profileId, staffName }: Props) {
  const { user } = useAuth();
  const canManage = !!user?.permissions?.includes('hr_queries:manage') || user?.role === 'admin';
  const { queries, loading, issue, close, reopen } = useStaffQueries({ profileId });
  const [showIssue, setShowIssue] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = queries.find(q => q.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>Queries ({queries.length})</p>
        {canManage && (
          <button onClick={() => setShowIssue(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: '#EC0118' }}>
            <i className="ri-file-warning-line mr-1" /> Issue Query
          </button>
        )}
      </div>

      {selected ? (
        <div className="space-y-3">
          <button onClick={() => setSelectedId(null)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <i className="ri-arrow-left-line" /> Back to all queries
          </button>
          <QueryThread
            query={selected}
            canManage={canManage}
            onClose={canManage ? () => close(selected.id) : undefined}
            onReopen={canManage ? () => reopen(selected.id) : undefined}
          />
        </div>
      ) : loading ? (
        <p className="text-xs py-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      ) : queries.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <i className="ri-file-shield-2-line text-2xl mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No queries issued to this staff member</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queries.map(q => {
            const style = q.status === 'open'
              ? { bg: 'rgba(245,158,11,0.12)', fg: '#B45309', label: 'Awaiting Response' }
              : q.status === 'responded'
              ? { bg: 'rgba(59,130,246,0.12)', fg: '#1D4ED8', label: 'Responded' }
              : { bg: 'rgba(100,116,139,0.12)', fg: '#475569', label: 'Closed' };
            return (
              <button key={q.id} onClick={() => setSelectedId(q.id)}
                className="w-full text-left rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{q.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {q.issuer?.name ?? 'HR'} · {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0" style={{ background: style.bg, color: style.fg }}>
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showIssue && (
        <IssueQueryModal
          staffName={staffName}
          onSave={(input) => issue({ profileId, ...input })}
          onClose={() => setShowIssue(false)}
        />
      )}
    </div>
  );
}
