import { createHash, randomBytes } from 'crypto';

export function generateRawKey(): string {
  return `amibroke_${randomBytes(32).toString('hex')}`;
}

export function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function extractPrefix(rawKey: string): string {
  return rawKey.slice(0, 16);
}
