import {
  assertAllowedOrigin, adminClient, clientIp, corsHeaders, json, parseCredential,
  paystackApi, paystackConfig, sha256,
} from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);

  let reference = '';
  try {
    assertAllowedOrigin(req);
    const body = await req.json() as Record<string, unknown>;
    const credential = parseCredential(body);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const paymentOption = typeof body.paymentOption === 'string' ? body.paymentOption : '';
    const customAmount = Number.isSafeInteger(body.customAmountPesewas) ? body.customAmountPesewas as number : null;
    const idempotencyKey = (req.headers.get('idempotency-key') ?? String(body.idempotencyKey ?? '')).trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
      return json(req, { error: 'A valid idempotency key is required.' }, 400);
    }

    const { environment } = paystackConfig();
    const requestHash = await sha256(JSON.stringify({ credential, email, paymentOption, customAmount }));
    const db = adminClient();
    const { data, error } = await db.schema('wireless').rpc('create_public_paystack_attempt', {
      p_public_token: credential.token ?? null,
      p_ticket_number: credential.ticketNumber ?? null,
      p_phone: credential.phone ?? null,
      p_request_ip: clientIp(req),
      p_customer_email: email,
      p_payment_option: paymentOption,
      p_custom_amount: customAmount,
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash,
      p_environment: environment,
    });
    if (error) throw error;
    const attempt = data as Record<string, unknown>;
    reference = String(attempt.reference);
    if (attempt.authorization_url) return json(req, attempt);
    if (attempt.existing) return json(req, attempt, 202);

    const callbackUrl = Deno.env.get('PAYSTACK_CALLBACK_URL') ?? 'https://user.wirelesscares.com/?payment_return=1';
    const cancelUrl = new URL(callbackUrl);
    cancelUrl.searchParams.set('payment_cancelled', '1');
    cancelUrl.searchParams.set('reference', reference);
    const initialized = await paystackApi('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: attempt.amount_pesewas,
        currency: 'GHS',
        reference,
        callback_url: callbackUrl,
        metadata: {
          attempt_id: attempt.attempt_id,
          invoice_number: attempt.invoice_number,
          ticket_number: attempt.ticket_number,
          cancel_action: cancelUrl.toString(),
        },
      }),
    });
    const gateway = initialized.data as Record<string, unknown>;
    const { error: updateError } = await db.schema('wireless').rpc('mark_paystack_initialized', {
      p_reference: reference,
      p_authorization_url: gateway.authorization_url,
    });
    if (updateError) throw updateError;
    return json(req, { ...attempt, status: 'processing', authorization_url: gateway.authorization_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initialization failed.';
    console.error('[paystack-initialize]', message);
    if (reference) {
      await adminClient().schema('wireless').rpc('mark_paystack_requires_verification', {
        p_reference: reference, p_reason: message,
      });
    }
    return json(req, { error: reference
      ? 'We could not confirm whether checkout started. Check this payment status before trying again.'
      : 'Unable to start payment.' }, 503);
  }
});
