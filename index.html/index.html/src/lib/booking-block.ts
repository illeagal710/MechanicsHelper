/**
 * Owner-controlled “block X hours after each booking” for a single bay/provider.
 * Default is 3 hours so a solo shop does not overbook by accident.
 */

export const DEFAULT_BLOCK_AFTER_HOURS = 3;
export const BLOCK_AFTER_HOURS_CHOICES = [0, 1, 2, 3, 4] as const;

export type BlockAfterHours = (typeof BLOCK_AFTER_HOURS_CHOICES)[number];

const HOUR_MS = 60 * 60 * 1000;

export function isBlockAfterHours(value: unknown): value is BlockAfterHours {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (BLOCK_AFTER_HOURS_CHOICES as readonly number[]).includes(value)
  );
}

/** Missing or invalid settings fall back to 3 hours (not Off). */
export function normalizeBlockAfterHours(value: unknown): BlockAfterHours {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (isBlockAfterHours(parsed)) return parsed;
  }
  if (isBlockAfterHours(value)) return value;
  return DEFAULT_BLOCK_AFTER_HOURS;
}

export function parseSlotMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True when candidate T is in [S, S + X hours).
 * X = 0 (Off) still blocks the exact start, matching today’s same-slot rule.
 */
export function slotInBlockWindow(bookedStartIso: string, candidateIso: string, blockHours: number): boolean {
  const start = parseSlotMs(bookedStartIso);
  const candidate = parseSlotMs(candidateIso);
  if (!Number.isFinite(start) || !Number.isFinite(candidate)) return false;
  const hours = Math.max(0, Number(blockHours) || 0);
  if (candidate === start) return true;
  if (hours <= 0) return false;
  return candidate > start && candidate < start + hours * HOUR_MS;
}

export function blockHoursFromRecord(record?: { blockAfterHours?: unknown } | null): BlockAfterHours {
  return normalizeBlockAfterHours(record?.blockAfterHours);
}
