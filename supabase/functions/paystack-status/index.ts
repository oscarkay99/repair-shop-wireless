import {
  assertAllowedOrigin, adminClient, corsHeaders, finalizeVerifiedSuccess, json,
  paystackConfig, verifyTransaction,
} from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed.' }, 405);
  try {
    assertAllowedOrigin(req);
    paystackConfig();
    const body = await req.json() as Record<string, unknown>;
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    if (!/^WLS-[a-f0-9]{32}$/i.test(reference)) return json(req, { error: 'Invalid payment reference.' }, 400);

    const db = adminClient();
    const { data: attempt, error } = await db.schema('wireless').from('paystack_payment_attempts')
      .select('payment_status,paystack_reference,expected_amount,currency,invoice_id,failure_reason')
      .eq('paystack_reference', reference).single();
    if (error || !attempt) return json(req, { error: 'Payment attempt was not found.' }, 404);

    let receipt: Record<string, unknown> | null = null;
    if (!['success', 'refunded'].includes(attempt.payment_status)) {
      try {
        const verified = await verifyTransaction(reference);
        if (verified.status === 'success') {
          receipt = await finalizeVerifiedSuccess(reference, verified);
        } else if (['failed', 'abandoned', 'reversed'].includes(verified.status)) {
          await db.schema('wireless').rpc('record_paystack_terminal_status', {
            p_reference: reference,
            p_status: verified.status === 'abandoned' ? 'cancelled' : 'failed',
            p_reason: `Paystack status: ${verified.status}`,
          });
        } else {
          await db.schema('wireless').rpc('mark_paystack_requires_verification', {
            p_reference: reference, p_reason: `Paystack status: ${verified.status}`,
          });
        }
      } catch (verifyError) {
        console.warn('[paystack-status] verification unavailable', verifyError instanceof Error ? verifyError.message : verifyError);
      }
    }

    const { data: current } = await db.schema('wireless').from('paystack_payment_attempts')
      .select('payment_status,paystack_reference,expected_amount,currency,failure_reason,completed_at')
      .eq('paystack_reference', reference).single();
    if (current?.payment_status === 'success' && !receipt) {
      const { data: payment } = await db.schema('wireless').from('payments')
        .select('receipt_number,amount,paid_at,invoice:invoices(invoice_number,total,amount_paid)')
        .eq('provider', 'paystack').eq('provider_reference', reference).single();
      receipt = payment as Record<string, unknown> | null;
    }
    return json(req, { payment: current, receipt });
  } catch (error) {
    console.error('[paystack-status]', error instanceof Error ? error.message : error);
    return json(req, { error: 'Unable to confirm payment status right now.' }, 503);
  }
});
