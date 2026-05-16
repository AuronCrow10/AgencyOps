import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from '../auth/password.js';

export function generateApiKey(): string {
  return `agop_${crypto.randomBytes(24).toString('hex')}`;
}

export async function hashApiKey(rawKey: string): Promise<string> {
  return hashPassword(rawKey);
}

export async function verifyApiKeyHash(hash: string, rawKey: string): Promise<boolean> {
  return verifyPassword(hash, rawKey);
}
