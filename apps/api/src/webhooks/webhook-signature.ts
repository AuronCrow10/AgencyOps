import crypto from 'node:crypto';

export function signWebhookPayload(secret: string, payload: unknown): string {
  const serialized = JSON.stringify(payload);
  const digest = crypto.createHmac('sha256', secret).update(serialized).digest('hex');
  return `sha256=${digest}`;
}
