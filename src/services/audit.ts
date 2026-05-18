export interface AuditEventInput {
  layer?: string; action: string; entityType: string; entityId?: string;
  status: string; summary: string; metadata?: Record<string, unknown>;
}

const auditLog: (AuditEventInput & { id: string; timestamp: string })[] = [];

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  auditLog.push({ ...event, id: `AUD-${Date.now()}`, timestamp: new Date().toISOString() });
}

export async function getAuditLog() { return [...auditLog].reverse(); }

export async function runAuditedMutation<T>(
  _meta: AuditEventInput,
  fn: () => Promise<T>,
): Promise<T> {
  return fn();
}

export type AuditLogRecord = AuditEventInput & { id: string; timestamp: string };
export async function getAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
  return [...auditLog].reverse().slice(0, limit);
}
