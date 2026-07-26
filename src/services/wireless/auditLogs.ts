import { db } from '@/services/supabase';
import { AUDIT_ACTION_LABEL, summarizeAuditAction } from '@/utils/auditSummary';

export type AuditStatus = 'success' | 'failure' | 'attempted' | 'info';
export type AuditSource = 'frontend' | 'backend';

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  status: AuditStatus;
  source: AuditSource;
  layer: string;
  summary: string;
  metadata?: Record<string, unknown>;
  beforeData?: unknown;
  afterData?: unknown;
  requestPath?: string;
  createdAt: string;
}

type AuditLogRow = {
  id: string;
  action: string;
  table_name: string;
  entity_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
};

// These rows come from Postgres triggers firing after a real, already-committed
// change — there's no "attempted" or "failure" state to capture at this layer,
// and no frontend request context, so status/source/layer are fixed rather
// than derived from anything in the row.
function toRecord(row: AuditLogRow): AuditLogRecord {
  return {
    id: row.id,
    action: AUDIT_ACTION_LABEL[row.action] ?? row.action,
    entityType: row.table_name,
    entityId: row.entity_id ?? undefined,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    status: 'success',
    source: 'backend',
    layer: 'database',
    summary: summarizeAuditAction(row.actor_name, row.action, row.table_name),
    beforeData: row.before_data ?? undefined,
    afterData: row.after_data ?? undefined,
    createdAt: row.created_at,
  };
}

// Sentinel for "no actor" rows (automated/trigger-only events where
// actor_name is genuinely NULL in the DB) — the UI displays these as
// "System", which isn't a real value stored anywhere to filter by directly.
export const SYSTEM_ACTOR = '__system__';

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  /** Free-text search — matches against the raw action/table/actor/entity
   *  columns server-side. Not a perfect match for the human-readable
   *  summary shown in the UI (that's generated client-side), but it
   *  searches the *entire* table instead of whatever page happened to be
   *  loaded, which matters more than an exact text match. */
  search?: string;
  actorName?: string;
}

export interface AuditLogPage {
  logs: AuditLogRecord[];
  total: number;
}

// Was previously a hard `.limit(200)` with no offset — anything past the
// 200 most recent rows was silently unreachable (not just slow to load,
// genuinely invisible: no filter, search, or page control could ever surface
// it). This now does real range-based pagination so older history stays
// reachable no matter how large the table grows.
export async function getAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogPage> {
  const { page = 1, pageSize = 50, search, actorName } = query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = db
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (actorName === SYSTEM_ACTOR) q = q.is('actor_name', null);
  else if (actorName) q = q.eq('actor_name', actorName);
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`action.ilike.${term},table_name.ilike.${term},actor_name.ilike.${term},entity_id.ilike.${term}`);
  }

  const { data, error, count } = await q.range(from, to);
  if (error) throw error;
  return { logs: ((data as AuditLogRow[] | null) ?? []).map(toRecord), total: count ?? 0 };
}

// Sign-in/out are never a table mutation, so the trigger-based capture in
// capture_audit_log() never sees them — this is the one place the client
// writes its own audit row. RLS (audit_logs_insert) only allows a row whose
// actor_id matches auth.uid(), so this must run while the caller still has a
// live session — logout has to log *before* supabase.auth.signOut(), not after.
export async function logAuthEvent(action: 'login' | 'logout', actor: { id: string; name: string }): Promise<void> {
  try {
    // Supabase syncs auth state across every open tab of the app (and can
    // re-fire SIGNED_IN on its own, e.g. when another tab's session becomes
    // visible) — without this check, one real login shows up as several
    // duplicate entries. Checked server-side, not with an in-memory flag,
    // since the duplicate firing happens across separate tabs/JS contexts
    // that don't share memory.
    const { data: recent } = await db
      .from('audit_logs')
      .select('action, created_at')
      .eq('actor_id', actor.id)
      .eq('table_name', 'security')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const recentRow = recent as { action: string; created_at: string } | null;
    if (recentRow && recentRow.action === action && Date.now() - new Date(recentRow.created_at).getTime() < 60_000) {
      return;
    }

    const { error } = await db.from('audit_logs').insert({
      action,
      table_name: 'security',
      entity_id: actor.id,
      actor_id: actor.id,
      actor_name: actor.name,
    });
    if (error) throw error;
  } catch (e) {
    console.warn('[auditLogs] failed to log auth event', e);
  }
}
