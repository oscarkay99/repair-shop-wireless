export const AUDIT_ACTION_LABEL: Record<string, string> = { insert: 'created', update: 'updated', delete: 'deleted' };

export function summarizeAuditAction(actorName: string | null | undefined, action: string, tableName: string): string {
  const who = actorName || 'Someone';
  const verb = AUDIT_ACTION_LABEL[action] ?? action;
  const what = tableName.replace(/_/g, ' ').replace(/s$/, '');
  return `${who} ${verb} a ${what} record`;
}
