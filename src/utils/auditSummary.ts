export const AUDIT_ACTION_LABEL: Record<string, string> = {
  insert: 'created', update: 'updated', delete: 'deleted', login: 'signed in', logout: 'signed out',
};

// Present on nearly every audited row but never meaningful to call out as
// "what changed" — timestamps move on every write, ids/foreign keys are
// structural, not a user-facing edit.
const IGNORED_FIELDS = new Set(['id', 'created_at', 'updated_at']);

function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ');
}

function isSimpleScalar(v: unknown): v is string | number | boolean {
  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

function fmtScalar(v: string | number | boolean): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

/** Names (and, for simple scalar values, old→new) whichever fields actually
 *  differ between before/after — e.g. "total spent (0 → 17.25)" — so the
 *  message says what changed, not just that something did. */
function describeChange(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined): string {
  if (!before || !after) return '';
  const changed = Object.keys(after).filter(k => !IGNORED_FIELDS.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  if (changed.length === 0) return '';
  const parts = changed.slice(0, 2).map(k => {
    const b = before[k], a = after[k];
    return isSimpleScalar(b) && isSimpleScalar(a) ? `${fieldLabel(k)} (${fmtScalar(b)} → ${fmtScalar(a)})` : fieldLabel(k);
  });
  const extra = changed.length - parts.length;
  return parts.join(', ') + (extra > 0 ? `, +${extra} more` : '');
}

export function summarizeAuditAction(
  actorName: string | null | undefined,
  action: string,
  tableName: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): string {
  const who = actorName || 'Someone';
  if (tableName === 'security') return `${who} ${action === 'login' ? 'signed in' : 'signed out'}`;
  const verb = AUDIT_ACTION_LABEL[action] ?? action;
  const what = tableName.replace(/_/g, ' ').replace(/s$/, '');
  const change = action === 'update' ? describeChange(before, after) : '';
  return change ? `${who} ${verb} a ${what} record — ${change}` : `${who} ${verb} a ${what} record`;
}
