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

export async function getAuditLogs(limit = 200): Promise<AuditLogRecord[]> {
  const { data, error } = await db
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as AuditLogRow[] | null) ?? []).map(toRecord);
}
