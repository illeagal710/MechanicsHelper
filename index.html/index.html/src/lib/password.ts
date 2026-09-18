import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for Mechanics Helper accounts.
 *
 * Stored format: `scrypt$<N>$<saltHex>$<hashHex>`. Salted per user and slow by
 * design. Older accounts used an unsalted FNV-1a hash; `verifyPassword` still
 * accepts those so nobody is locked out, and reports `needsRehash` so the caller
 * can transparently upgrade the stored hash on the next successful login.
 *
 * Server-only in practice (uses node:crypto); never import from client code.
 */

const PREFIX = "scrypt";
const SCRYPT_N = 16384; // CPU/memory cost (2^14)
const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;

/** Legacy unsalted FNV-1a hash. Retained only to verify and upgrade old rows. */
export function legacyPassHash(s: string): string {
  let h = 2166136261;
  const str = "mh|" + String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function isScryptHash(stored: unknown): boolean {
  return typeof stored === "string" && stored.startsWith(PREFIX + "$");
}

/** Hash a password with a fresh random salt. */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(String(password ?? ""), salt, SCRYPT_KEYLEN, { N: SCRYPT_N });
  return `${PREFIX}$${SCRYPT_N}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export type VerifyResult = { ok: boolean; needsRehash: boolean };

/**
 * Check a password against a stored hash. `needsRehash` is true when the stored
 * value is legacy or uses different scrypt parameters, so the caller should
 * re-store `hashPassword(password)` after a successful verify.
 */
export function verifyPassword(password: string, stored: string): VerifyResult {
  const pw = String(password ?? "");
  if (isScryptHash(stored)) {
    const parts = stored.split("$");
    if (parts.length !== 4) return { ok: false, needsRehash: false };
    const cost = Number(parts[1]);
    const salt = Buffer.from(parts[2], "hex");
    const expected = Buffer.from(parts[3], "hex");
    if (!Number.isFinite(cost) || cost < 2 || salt.length === 0 || expected.length === 0) {
      return { ok: false, needsRehash: false };
    }
    let derived: Buffer;
    try {
      derived = scryptSync(pw, salt, expected.length, { N: cost });
    } catch {
      return { ok: false, needsRehash: false };
    }
    const ok = derived.length === expected.length && timingSafeEqual(derived, expected);
    return { ok, needsRehash: ok && cost !== SCRYPT_N };
  }
  const ok = typeof stored === "string" && stored.length > 0 && legacyPassHash(pw) === stored;
  return { ok, needsRehash: ok };
}
