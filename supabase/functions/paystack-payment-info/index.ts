import { assertAllowedOrigin, adminClient, clientIp, corsHeaders, json, parseCredential } from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);
  try {
    assertAllowedOrigin(req);
    const body = await req.json() as Record<string, unknown>;
    const credential = parseCredential(body);
    const { data, error } = await adminClient().schema('wireless').rpc('get_public_invoice_payment_info', {
      p_public_token: credential.token ?? null,
      p_ticket_number: credential.ticketNumber ?? null,
      p_phone: credential.phone ?? null,
      p_request_ip: clientIp(req),
    });
    if (error) throw error;
    return json(req, data);
  } catch (error) {
    console.error('[paystack-payment-info]', error instanceof Error ? error.message : error);
    return json(req, { error: 'Unable to load payment information.' }, 400);
  }
});
