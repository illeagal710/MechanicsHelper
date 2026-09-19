/** Customer find / referral codes. Unique across shops and independent mechanics.
 *  Shop team-join codes live in the same uniqueness set and must never equal a find code. */

export const FIND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const FIND_CODE_MIN = 4;
export const FIND_CODE_MAX = 8;

export const FIND_CODE_INVALID = "Use 4–8 letters or numbers for your find code.";
export const FIND_CODE_TAKEN = "That find code is already taken.";
export const FIND_EQUALS_JOIN = "The customer find code and team join code must be different.";
export const USED_FIND_AS_JOIN = "That's the customer find code. Ask the owner for the team join code.";

/** Demo Riverside shop find code. Seeded when SEED_DEMO=1. Not claimable by others. */
export const DEMO_SHOP_FIND_CODE = "RIV4";

/**
 * Permanently reserved find codes. LEON is intentionally absent — a real shop
 * (including Leon's) may claim it. Uniqueness still rejects a true duplicate.
 */
export const RESERVED_FIND_CODES = new Set<string>([DEMO_SHOP_FIND_CODE]);

export type FindCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

/** Uppercase, strip spaces and punctuation so "leo n" / "leon!" still parse. */
export function normalizeFindCode(raw: string): string {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function parseFindCode(raw: string): FindCodeResult {
  const code = normalizeFindCode(raw);
  if (code.length < FIND_CODE_MIN || code.length > FIND_CODE_MAX) {
    return { ok: false, error: FIND_CODE_INVALID };
  }
  return { ok: true, code };
}

export function generateFindCode(len = FIND_CODE_MIN): string {
  const n = Math.min(FIND_CODE_MAX, Math.max(FIND_CODE_MIN, len));
  let s = "";
  for (let i = 0; i < n; i++) {
    s += FIND_CODE_CHARS[Math.floor(Math.random() * FIND_CODE_CHARS.length)];
  }
  return s;
}

export function generateUnusedCode(used: Set<string>, ...reserved: string[]): string {
  const blocked = new Set([
    ...used,
    ...RESERVED_FIND_CODES,
    ...reserved.map(normalizeFindCode).filter(Boolean),
  ]);
  let c = generateFindCode();
  while (blocked.has(c)) c = generateFindCode();
  return c;
}

/**
 * Claim `raw` if it is a valid unused code. `current` is this account's existing
 * find code so they can keep it without a false "taken" error.
 * `blocked` extra values (the shop's team join code) must stay distinct.
 */
export function claimFindCode(
  raw: string,
  used: Set<string>,
  current?: string,
  blocked?: string,
): FindCodeResult {
  const parsed = parseFindCode(raw);
  if (!parsed.ok) return parsed;
  const currentNorm = current ? normalizeFindCode(current) : "";
  if (currentNorm && parsed.code === currentNorm) return parsed;
  const blockedNorm = blocked ? normalizeFindCode(blocked) : "";
  if (blockedNorm && parsed.code === blockedNorm) {
    return { ok: false, error: FIND_EQUALS_JOIN };
  }
  if (RESERVED_FIND_CODES.has(parsed.code) && parsed.code !== currentNorm) {
    return { ok: false, error: FIND_CODE_TAKEN };
  }
  if (used.has(parsed.code)) return { ok: false, error: FIND_CODE_TAKEN };
  return parsed;
}

/** Customer find code and employee team-join code must never be the same value. */
export function findDiffersFromJoin(findCode: string, joinCode: string): boolean {
  const find = normalizeFindCode(findCode);
  const join = normalizeFindCode(joinCode);
  return !!find && !!join && find !== join;
}

export type ShopCodePair =
  | { ok: true; findCode: string; joinCode: string }
  | { ok: false; error: string };

/** Allocate a customer find code plus a different team-join code. */
export function allocateShopCodes(preferredFind: string | undefined, used: Set<string>): ShopCodePair {
  const raw = String(preferredFind || "").trim();
  const find = raw ? claimFindCode(raw, used) : { ok: true as const, code: generateUnusedCode(used) };
  if (!find.ok) return find;
  const joinCode = generateUnusedCode(used, find.code);
  if (!findDiffersFromJoin(find.code, joinCode)) {
    return { ok: false, error: FIND_EQUALS_JOIN };
  }
  return { ok: true, findCode: find.code, joinCode };
}
