export const AUDIT_ACTION_LABEL: Record<string, string> = {
  insert: 'created', update: 'updated', delete: 'deleted', login: 'signed in', logout: 'signed out',
};

export function summarizeAuditAction(actorName: string | null | undefined, action: string, tableName: string): string {
  const who = actorName || 'Someone';
  if (tableName === 'security') return `${who} ${action === 'login' ? 'signed in' : 'signed out'}`;
  const verb = AUDIT_ACTION_LABEL[action] ?? action;
  const what = tableName.replace(/_/g, ' ').replace(/s$/, '');
  return `${who} ${verb} a ${what} record`;
}
