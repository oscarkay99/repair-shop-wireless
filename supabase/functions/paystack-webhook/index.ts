import {
  adminClient, finalizeVerifiedSuccess, isAllowedPaystackWebhookIp, paystackConfig, sha256,
  validPaystackSignature, verifyTransaction,
} from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!isAllowedPaystackWebhookIp(req)) {
    console.warn('[paystack-webhook] rejected source IP');
    return new Response('Source not allowed', { status: 403 });
  }
  const rawBody = await req.text();
  try {
    const { secret } = paystackConfig();
    const valid = await validPaystackSignature(rawBody, req.headers.get('x-paystack-signature'), secret);
    if (!valid) return new Response('Invalid signature', { status: 401 });

    const event = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
    if (!event.event || !event.data) return new Response('Malformed event', { status: 400 });
    const reference = typeof event.data.reference === 'string' ? event.data.reference : '';
    const transactionId = String(event.data.id ?? '');
    const eventKey = `${event.event}:${transactionId}:${reference}`;
    const payloadHash = await sha256(rawBody);

    if (event.event !== 'charge.success') {
      await adminClient().schema('wireless').from('paystack_webhook_events').upsert({
        event_key: eventKey,
        event_type: event.event,
        payment_reference: reference || null,
        provider_transaction_id: transactionId || null,
        payload: event,
        payload_hash: payloadHash,
        processing_status: 'ignored',
        processed_at: new Date().toISOString(),
      }, { onConflict: 'event_key', ignoreDuplicates: true });
      return new Response('ok', { status: 200 });
    }

    if (!/^WLS-[a-f0-9]{32}$/i.test(reference)) return new Response('ok', { status: 200 });
    const verified = await verifyTransaction(reference);
    if (verified.status !== 'success') throw new Error('Paystack did not verify this charge as successful.');
    const result = await finalizeVerifiedSuccess(reference, verified, {
      key: eventKey, payload: event as unknown as Record<string, unknown>, hash: payloadHash,
    });
    if (result.integrity_error) {
      console.error('[paystack-webhook] integrity mismatch', reference);
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('[paystack-webhook]', error instanceof Error ? error.message : error);
    // A non-2xx makes Paystack retry. Database uniqueness makes every retry safe.
    return new Response('Temporary processing failure', { status: 503 });
  }
});
