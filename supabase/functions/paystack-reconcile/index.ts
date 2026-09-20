import { adminClient, finalizeVerifiedSuccess, paystackConfig, verifyTransaction } from '../_shared/paystack.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expectedSecret = Deno.env.get('PAYSTACK_RECONCILE_SECRET') ?? '';
  if (!expectedSecret || req.headers.get('x-reconcile-secret') !== expectedSecret) {
    return new Response('Not authorized', { status: 401 });
  }
  try {
    paystackConfig();
    const db = adminClient();
    const { data: attempts, error } = await db.schema('wireless').from('paystack_payment_attempts')
      .select('paystack_reference,payment_status,initiated_at')
      .in('payment_status', ['processing', 'requires_verification'])
      .lt('updated_at', new Date(Date.now() - 2 * 60_000).toISOString())
      .order('updated_at', { ascending: true }).limit(50);
    if (error) throw error;

    const results: Record<string, string> = {};
    for (const attempt of attempts ?? []) {
      try {
        const verified = await verifyTransaction(attempt.paystack_reference);
        if (verified.status === 'success') {
          await finalizeVerifiedSuccess(attempt.paystack_reference, verified);
          results[attempt.paystack_reference] = 'success';
        } else if (['failed', 'abandoned', 'reversed'].includes(verified.status)) {
          await db.schema('wireless').rpc('record_paystack_terminal_status', {
            p_reference: attempt.paystack_reference,
            p_status: verified.status === 'abandoned' ? 'cancelled' : 'failed',
            p_reason: `Reconciliation status: ${verified.status}`,
          });
          results[attempt.paystack_reference] = verified.status;
        } else {
          results[attempt.paystack_reference] = verified.status;
        }
      } catch (error) {
        results[attempt.paystack_reference] = error instanceof Error ? error.message : 'verification error';
      }
    }
    return Response.json({ processed: Object.keys(results).length, results });
  } catch (error) {
    console.error('[paystack-reconcile]', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Reconciliation failed.' }, { status: 503 });
  }
});
