/** Customer find / referral codes. Unique across shops and independent mechanics. */

export const FIND_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const FIND_CODE_MIN = 4;
export const FIND_CODE_MAX = 8;

export const FIND_CODE_INVALID = "Use 4–8 letters or numbers for your find code.";
export const FIND_CODE_TAKEN = "That find code is already taken.";

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

/**
 * Claim `raw` if it is a valid unused code. `current` is this account's existing
 * code so they can keep it without a false "taken" error.
 */
export function claimFindCode(raw: string, used: Set<string>, current?: string): FindCodeResult {
  const parsed = parseFindCode(raw);
  if (!parsed.ok) return parsed;
  if (current && parsed.code === current) return parsed;
  if (used.has(parsed.code)) return { ok: false, error: FIND_CODE_TAKEN };
  return parsed;
}
