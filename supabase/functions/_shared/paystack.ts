import { createClient } from 'npm:@supabase/supabase-js@2';

export type PublicCredential = { token?: string; ticketNumber?: string; phone?: string };

export function corsHeaders(req: Request): Record<string, string> {
  const allowed = (Deno.env.get('CUSTOMER_APP_ORIGINS') ?? 'https://user.wirelesscares.com')
    .split(',').map((value) => value.trim()).filter(Boolean);
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function assertAllowedOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  if (!origin) return;
  const allowed = (Deno.env.get('CUSTOMER_APP_ORIGINS') ?? 'https://user.wirelesscares.com')
    .split(',').map((value) => value.trim());
  if (!allowed.includes(origin)) throw new Error('Origin is not allowed.');
}

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-real-ip') ?? 'unknown').trim().slice(0, 80) || 'unknown';
}

export function parseCredential(body: Record<string, unknown>): PublicCredential {
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const ticketNumber = typeof body.ticketNumber === 'string' ? body.ticketNumber.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (token) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
      throw new Error('Invalid ticket credential.');
    }
    return { token };
  }
  if (!ticketNumber || phone.replace(/\D/g, '').length < 9) {
    throw new Error('Ticket number and phone number are required.');
  }
  return { ticketNumber, phone };
}

export function paystackConfig() {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
  const environment = Deno.env.get('PAYSTACK_ENVIRONMENT') ?? 'test';
  if (!['test', 'live'].includes(environment)) throw new Error('Invalid Paystack environment configuration.');
  if (!secret) throw new Error('Paystack is not configured.');
  if (environment === 'test' && !secret.startsWith('sk_test_')) throw new Error('Test environment requires a Paystack test key.');
  if (environment === 'live' && (!secret.startsWith('sk_live_') || Deno.env.get('ALLOW_PAYSTACK_LIVE') !== 'true')) {
    throw new Error('Live Paystack payments are disabled.');
  }
  return { secret, environment };
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validPaystackSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['verify']);
  const signatureBytes = new Uint8Array(signature.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(rawBody));
}

export async function paystackApi(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const { secret } = paystackConfig();
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const raw = await response.text();
  // Paystack documents transaction IDs as unsigned 64-bit integers. Preserve
  // values outside JavaScript's safe integer range as strings before parsing.
  const safeJson = raw.replace(/("id"\s*:\s*)(\d{16,})(?=\s*[,}])/g, '$1"$2"');
  const payload = (() => {
    try { return JSON.parse(safeJson) as Record<string, unknown>; }
    catch { return {}; }
  })();
  if (!response.ok || payload.status !== true) {
    const message = typeof payload.message === 'string' ? payload.message : 'Paystack request failed.';
    throw new Error(message);
  }
  return payload;
}

export interface VerifiedTransaction {
  id: number | string;
  domain: 'test' | 'live';
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  gateway_response?: string;
  paid_at?: string;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  if (!/^WLS-[a-f0-9]{32}$/i.test(reference)) throw new Error('Invalid payment reference.');
  const payload = await paystackApi(`/transaction/verify/${encodeURIComponent(reference)}`);
  return payload.data as VerifiedTransaction;
}

export async function finalizeVerifiedSuccess(
  reference: string,
  verified: VerifiedTransaction,
  webhook?: { key: string; payload: Record<string, unknown>; hash: string },
) {
  const { environment } = paystackConfig();
  if (verified.reference !== reference || verified.domain !== environment) {
    throw new Error('Verified transaction identity or environment mismatch.');
  }
  const db = adminClient();
  const { data, error } = await db.schema('wireless').rpc('finalize_paystack_success', {
    p_reference: reference,
    p_paid_amount: verified.amount,
    p_currency: verified.currency,
    p_channel: verified.channel ?? 'unknown',
    p_gateway_response: verified.gateway_response ?? 'Successful',
    p_provider_transaction_id: String(verified.id),
    p_paid_at: verified.paid_at ?? new Date().toISOString(),
    p_webhook_event_key: webhook?.key ?? null,
    p_webhook_payload: webhook?.payload ?? null,
    p_payload_hash: webhook?.hash ?? null,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}
