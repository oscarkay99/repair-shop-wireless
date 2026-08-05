// Supabase/PostgREST errors are plain objects ({ message, details, hint, code }),
// never instances of the native Error class — a bare `e instanceof Error` check
// misses them entirely and falls through to the generic fallback, hiding the
// actual reason (e.g. a CHECK constraint violation) behind unhelpful text like
// "Failed to create repair job" with no indication of what actually went wrong.
//
// But a raw Postgres driver message (as opposed to one of our own
// `raise exception '...'` calls, always plain English) can contain internal
// schema details — constraint names, table/column names — that shouldn't
// reach an end user. Detect that shape specifically and translate it to a
// still-useful but schema-free message; log the original for debugging.
const RAW_DB_ERROR_PATTERN = /violates|duplicate key value|relation ".*" does not exist|column ".*" does not exist|permission denied for|null value in column/i;

function extractMessage(e: unknown): string | null {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return null;
}

export function errMessage(e: unknown, fallback = 'Something went wrong'): string {
  const raw = extractMessage(e);
  if (!raw) return fallback;
  if (!RAW_DB_ERROR_PATTERN.test(raw)) return raw;

  console.error('[errMessage] raw DB error kept out of the UI:', raw);
  if (/duplicate key value violates unique constraint/i.test(raw)) return 'That value is already in use — please use a different one.';
  if (/violates foreign key constraint/i.test(raw)) return "That record is linked to other data and can't be changed this way.";
  if (/violates check constraint|violates not-null constraint|null value in column/i.test(raw)) return "One of the values entered isn't valid — please check and try again.";
  if (/permission denied for/i.test(raw)) return "You don't have permission to do that.";
  return fallback;
}
