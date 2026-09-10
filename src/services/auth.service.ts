import crypto from 'crypto';

// Hashed credentials for owner
const OWNER_USERNAME = 'fajarkeren';
const OWNER_SALT = 'musik_salt_fajar_2026';
// PBKDF2 SHA-512 hash of 'musikedan213' with 100,000 iterations
const OWNER_HASH = '35799b6f8ec524ea543dbe919aa0299cbf1fb65ecf035064ed1bc59101d95485aa6485cf78c869759a73ce8147367985d7836a90c067e8d455ed74e58e4fa916';

// Store active owner sessions in memory (persisted across requests)
const activeOwnerTokens = new Set<string>();

export function verifyOwnerCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  if (username.trim().toLowerCase() !== OWNER_USERNAME.toLowerCase()) return false;

  const computedHash = crypto
    .pbkdf2Sync(password, OWNER_SALT, 100000, 64, 'sha512')
    .toString('hex');

  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(OWNER_HASH, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createOwnerSession(): string {
  const token = `owner_${crypto.randomBytes(32).toString('hex')}`;
  activeOwnerTokens.add(token);
  return token;
}

export function invalidateOwnerSession(token: string): void {
  if (token) {
    activeOwnerTokens.delete(token);
  }
}

export function isOwnerSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  return activeOwnerTokens.has(token);
}

export function getOwnerUser() {
  return {
    username: OWNER_USERNAME,
    role: 'owner',
    displayName: 'Fajar (Owner)',
  };
}
