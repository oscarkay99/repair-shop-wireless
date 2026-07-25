import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import { getAuditLogs, type AuditLogRecord } from '@/services/wireless/auditLogs';
import { errMessage } from '@/utils/errors';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/shared/Pagination';

const statusTone: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  failure: 'bg-red-50 text-red-600 border-red-100',
  attempted: 'bg-amber-50 text-amber-700 border-amber-100',
  info: 'bg-sky-50 text-sky-700 border-sky-100',
};

const sourceTone: Record<string, string> = {
  frontend: 'bg-[#EC0118]/8 text-[#EC0118]',
  backend: 'bg-amber-50 text-amber-700',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function previewJson(value: unknown) {
  if (!value || (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0)) {
    return 'No extra metadata';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'Unable to render metadata';
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [layerFilter, setLayerFilter] = useState('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const records = await getAuditLogs();
        if (active) {
          setLogs(records);
          setSelectedLogId(records[0]?.id ?? null);
        }
      } catch (err) {
        if (active) {
          setError(errMessage(err, 'Failed to load audit logs'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLogs();
    return () => {
      active = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch = !query || [
        log.action,
        log.entityType,
        log.entityId,
        log.actorEmail,
        log.actorName,
        log.summary,
      ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
      const matchesLayer = layerFilter === 'all' || log.layer === layerFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesLayer;
    });
  }, [layerFilter, logs, search, sourceFilter, statusFilter]);

  const { paginated: pagedLogs, page, setPage, totalPages, total, from, to } = usePagination(filteredLogs, 25, `${search}|${statusFilter}|${sourceFilter}|${layerFilter}`);
  const selectedLog = pagedLogs.find((log) => log.id === selectedLogId) ?? pagedLogs[0] ?? null;

  const summaryStats = [
    { label: 'Total Events', value: String(logs.length), icon: 'ri-file-list-3-line', accent: 'bg-[#EC0118]' },
    { label: 'Failed Actions', value: String(logs.filter((log) => log.status === 'failure').length), icon: 'ri-error-warning-line', accent: 'bg-red-500' },
    { label: 'Frontend Events', value: String(logs.filter((log) => log.source === 'frontend').length), icon: 'ri-cursor-line', accent: 'bg-sky-500' },
    { label: 'Backend Events', value: String(logs.filter((log) => log.source === 'backend').length), icon: 'ri-database-2-line', accent: 'bg-amber-500' },
  ];

  return (
    <AdminLayout title="Audit Logs" subtitle="Review frontend and backend activity across the workspace">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-[hsl(var(--card))] rounded-2xl p-5 border border-[hsl(var(--border))] relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accent} rounded-l-2xl`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <i className={`${stat.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 mb-5">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="flex items-center gap-2 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 flex-1">
            <i className="ri-search-line text-sm text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, entity, actor or summary..."
              className="bg-transparent text-sm text-[hsl(var(--muted-foreground))] outline-none w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] outline-none cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="attempted">Attempted</option>
              <option value="info">Info</option>
            </select>

            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] outline-none cursor-pointer">
              <option value="all">All Sources</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
            </select>

            <select value={layerFilter} onChange={(e) => setLayerFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] outline-none cursor-pointer">
              <option value="all">All Layers</option>
              <option value="auth">Auth</option>
              <option value="ui">UI</option>
              <option value="service">Service</option>
              <option value="database">Database</option>
              <option value="edge_function">Edge Function</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-5">
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Recent Audit Trail</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{filteredLogs.length} matching events</p>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-20 text-center text-sm text-[hsl(var(--muted-foreground))]">
              <i className="ri-loader-4-line text-2xl animate-spin block mb-3" />
              Loading audit logs...
            </div>
          ) : error ? (

            <div className="px-5 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-red-50 text-red-500">
                <i className="ri-error-warning-line text-xl" />
              </div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">Unable to load audit logs</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{error}</p>
            </div>
          ) : (
            <>
            <div className="divide-y divide-[hsl(var(--border))]">
              {pagedLogs.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <i className="ri-inbox-archive-line text-3xl block mb-2 text-[hsl(var(--muted-foreground))]" />
                  No audit logs matched the current filters.
                </div>
              ) : null}
              {pagedLogs.map((log) => {
                const active = selectedLog?.id === log.id;

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full px-5 py-4 text-left transition-colors cursor-pointer ${active ? 'bg-[hsl(var(--muted))]' : 'hover:bg-[hsl(var(--muted))]/70'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center ${log.source === 'backend' ? 'bg-amber-50 text-amber-600' : 'bg-[#EC0118]/8 text-[#EC0118]'}`}>
                        <i className={`${log.source === 'backend' ? 'ri-database-2-line' : 'ri-cursor-line'} text-base`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusTone[log.status] ?? statusTone.info}`}>
                            {log.status}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${sourceTone[log.source] ?? sourceTone.frontend}`}>
                            {log.source}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{log.layer}</span>
                        </div>
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{log.summary || `${log.action} ${log.entityType || 'event'}`}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 truncate">
                          {log.action} · {log.entityType || 'unknown entity'}{log.entityId ? ` · ${log.entityId}` : ''}{log.actorEmail ? ` · ${log.actorEmail}` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{formatDate(log.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <Pagination page={page} pageCount={totalPages} total={total} pageSize={25} onPageChange={setPage} />
            </>
          )}
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Event Detail</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Inspect actor, metadata and row snapshots</p>
          </div>

          {!selectedLog ? (
            <div className="px-5 py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Select an audit entry to inspect it here.
            </div>
          ) : (
            <div className="p-5 space-y-4 max-h-[760px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Action</p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{selectedLog.action}</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Created</p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Entity</p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{selectedLog.entityType || 'N/A'}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{selectedLog.entityId || 'No entity id'}</p>
                </div>
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Actor</p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{selectedLog.actorName || 'Unknown user'}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{selectedLog.actorEmail || 'No actor email'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Summary</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusTone[selectedLog.status] ?? statusTone.info}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{selectedLog.summary || 'No summary provided for this event.'}</p>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Metadata</p>
                <pre className="text-[11px] leading-relaxed text-[hsl(var(--foreground))] whitespace-pre-wrap break-words bg-[hsl(var(--muted))] rounded-xl p-3 overflow-x-auto">
                  {previewJson(selectedLog.metadata)}
                </pre>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Before</p>
                <pre className="text-[11px] leading-relaxed text-[hsl(var(--foreground))] whitespace-pre-wrap break-words bg-[hsl(var(--muted))] rounded-xl p-3 overflow-x-auto">
                  {previewJson(selectedLog.beforeData)}
                </pre>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">After</p>
                <pre className="text-[11px] leading-relaxed text-[hsl(var(--foreground))] whitespace-pre-wrap break-words bg-[hsl(var(--muted))] rounded-xl p-3 overflow-x-auto">
                  {previewJson(selectedLog.afterData)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
