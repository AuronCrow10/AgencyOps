import { describe, expect, it } from 'vitest';
import { generateApiKey, hashApiKey, verifyApiKeyHash } from '../src/api-keys/api-key.utils.js';

describe('API key helpers', () => {
  it('generates, hashes, and verifies API keys', async () => {
    const rawKey = generateApiKey();
    const hash = await hashApiKey(rawKey);

    expect(rawKey.startsWith('agop_')).toBe(true);
    expect(hash).not.toBe(rawKey);
    await expect(verifyApiKeyHash(hash, rawKey)).resolves.toBe(true);
    await expect(verifyApiKeyHash(hash, `${rawKey}_invalid`)).resolves.toBe(false);
  });
});
