import { describe, expect, it } from 'vitest';
import { signWebhookPayload } from '../src/webhooks/webhook-signature.js';

describe('webhook signature generation', () => {
  it('creates stable HMAC signatures for the same payload', () => {
    const secret = 'top-secret';
    const payload = { eventType: 'lead.created', id: 'evt_1' };

    expect(signWebhookPayload(secret, payload)).toBe(signWebhookPayload(secret, payload));
  });

  it('changes when payload changes', () => {
    const secret = 'top-secret';

    expect(signWebhookPayload(secret, { a: 1 })).not.toBe(signWebhookPayload(secret, { a: 2 }));
  });
});
