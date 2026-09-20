import { isAllowedPaystackWebhookIp } from './paystack.ts';

function requestFrom(ip: string): Request {
  return new Request('https://api.example.test/functions/v1/paystack-webhook', {
    method: 'POST', headers: { 'x-real-ip': ip }, body: '{}',
  });
}

function assert(value: boolean, message: string): void {
  if (!value) throw new Error(message);
}

Deno.test('accepts every published Paystack webhook IP', () => {
  Deno.env.delete('PAYSTACK_WEBHOOK_IP_ALLOWLIST');
  for (const ip of ['52.31.139.75', '52.49.173.169', '52.214.14.220']) {
    assert(isAllowedPaystackWebhookIp(requestFrom(ip)), `${ip} should be allowed`);
  }
});

Deno.test('normalizes IPv4-mapped IPv6 addresses', () => {
  Deno.env.delete('PAYSTACK_WEBHOOK_IP_ALLOWLIST');
  assert(isAllowedPaystackWebhookIp(requestFrom('::ffff:52.31.139.75')), 'mapped address should be allowed');
});

Deno.test('rejects an unlisted address and honors an explicit staging override', () => {
  const original = Deno.env.get('PAYSTACK_WEBHOOK_IP_ALLOWLIST');
  try {
    Deno.env.delete('PAYSTACK_WEBHOOK_IP_ALLOWLIST');
    assert(!isAllowedPaystackWebhookIp(requestFrom('203.0.113.10')), 'unlisted address should be denied');
    Deno.env.set('PAYSTACK_WEBHOOK_IP_ALLOWLIST', '203.0.113.10');
    assert(isAllowedPaystackWebhookIp(requestFrom('203.0.113.10')), 'configured staging address should be allowed');
  } finally {
    if (original == null) Deno.env.delete('PAYSTACK_WEBHOOK_IP_ALLOWLIST');
    else Deno.env.set('PAYSTACK_WEBHOOK_IP_ALLOWLIST', original);
  }
});
