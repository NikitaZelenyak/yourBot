// Raw key is shown to user once. Only the hash is stored.
import { randomBytes, createHash } from 'crypto'

export function generateApiKey(): string {
  return `cb_live_${randomBytes(24).toString('base64url')}`
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export function validateApiKey(rawKey: string, storedHash: string): boolean {
  return hashApiKey(rawKey) === storedHash
}
