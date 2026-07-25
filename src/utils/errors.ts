// Supabase/PostgREST errors are plain objects ({ message, details, hint, code }),
// never instances of the native Error class — a bare `e instanceof Error` check
// misses them entirely and falls through to the generic fallback, hiding the
// actual reason (e.g. a CHECK constraint violation) behind unhelpful text like
// "Failed to create repair job" with no indication of what actually went wrong.
export function errMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return fallback;
}
