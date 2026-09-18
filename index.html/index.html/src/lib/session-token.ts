import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed session tokens for Mechanics Helper.
 *
 * Login/registration issues an HMAC-signed token carrying the verified user id;
 * account-ownership server functions require it and act on the id inside the
 * token, so a client can no longer act as another user by sending someone
 * else's id. Server-only (uses node:crypto).
 *
 * Set `AUTH_TOKEN_SECRET` in production; otherwise a dev-only default is used
 * (tokens then reset whenever the secret changes, which is fine for preview).
 */

const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const DEV_SECRET = "mh-dev-insecure-session-secret";

function secret(): string {
  const fromEnv = process.env.AUTH_TOKEN_SECRET || process.env.MH_AUTH_SECRET;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] AUTH_TOKEN_SECRET is not set — using an insecure default. Set it " +
        "so session tokens survive restarts and cannot be forged.",
    );
  }
  return DEV_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Issue a signed token for `userId`. */
export function signSession(userId: string, now: number = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: now + TTL_MS })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

/** Return the user id from a valid, unexpired token, or null. */
export function verifySession(token: string | undefined | null, now: number = Date.now()): string | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(payload);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data.sub !== "string" || !data.sub) return null;
    if (typeof data.exp === "number" && data.exp < now) return null;
    return data.sub;
  } catch {
    return null;
  }
}
