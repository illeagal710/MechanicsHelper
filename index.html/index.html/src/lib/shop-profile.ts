/** Public shop / independent card fields. Tags only — no cert files or directory. */

export const SPECIALTY_IDS = [
  "brakes",
  "diagnostics",
  "oil",
  "mobile",
  "tires",
  "engine",
  "electrical",
  "ac",
] as const;

export const CREDENTIAL_IDS = ["ase", "mobile_license", "insured"] as const;

export type SpecialtyId = (typeof SPECIALTY_IDS)[number];
export type CredentialId = (typeof CREDENTIAL_IDS)[number];

export const TAG_MAX = 32;
export const TAGS_MAX = 12;
export const SERVICE_AREA_MAX = 80;
export const YEARS_MIN = 1;
export const YEARS_MAX = 60;

export type PublicProfileFields = {
  specialties: string[];
  credentials: string[];
  serviceArea: string;
  yearsWrenching: string;
};

const EMPTY: PublicProfileFields = {
  specialties: [],
  credentials: [],
  serviceArea: "",
  yearsWrenching: "",
};

function isPreset(id: string, allowed: readonly string[]) {
  return allowed.includes(id);
}

function cleanTag(raw: unknown): string {
  const text = String(raw || "");
  if (/[<>]/.test(text)) return "";
  return text.replace(/\s+/g, " ").trim().slice(0, TAG_MAX);
}

export function parseTagsJson(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item || "")).filter(Boolean);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item || "")).filter(Boolean);
  } catch {
    /* comma / leftover text */
  }
  return raw
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sanitizeTags(raw: unknown, allowedIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of parseTagsJson(raw)) {
    const cleaned = cleanTag(item);
    if (!cleaned) continue;
    const preset = cleaned.toLowerCase().replace(/\s+/g, "_");
    const tag = isPreset(preset, allowedIds) ? preset : cleaned;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= TAGS_MAX) break;
  }
  return out;
}

export function sanitizeServiceArea(raw: unknown): string {
  return String(raw || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SERVICE_AREA_MAX);
}

export function sanitizeYearsWrenching(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n) || n < YEARS_MIN) return "";
  return String(Math.min(YEARS_MAX, n));
}

export function sanitizePublicProfile(patch: {
  specialties?: unknown;
  credentials?: unknown;
  serviceArea?: unknown;
  yearsWrenching?: unknown;
}): PublicProfileFields {
  return {
    specialties: sanitizeTags(patch.specialties, SPECIALTY_IDS),
    credentials: sanitizeTags(patch.credentials, CREDENTIAL_IDS),
    serviceArea: sanitizeServiceArea(patch.serviceArea),
    yearsWrenching: sanitizeYearsWrenching(patch.yearsWrenching),
  };
}

export function publicProfileFromRecord(r: {
  specialties?: unknown;
  credentials?: unknown;
  specialties_json?: unknown;
  credentials_json?: unknown;
  serviceArea?: unknown;
  service_area?: unknown;
  yearsWrenching?: unknown;
  years_wrenching?: unknown;
} | null | undefined): PublicProfileFields {
  if (!r) return { ...EMPTY };
  return {
    specialties: sanitizeTags(r.specialties ?? r.specialties_json, SPECIALTY_IDS),
    credentials: sanitizeTags(r.credentials ?? r.credentials_json, CREDENTIAL_IDS),
    serviceArea: sanitizeServiceArea(r.serviceArea ?? r.service_area),
    yearsWrenching: sanitizeYearsWrenching(r.yearsWrenching ?? r.years_wrenching),
  };
}

export function toggleTag(list: string[], tag: string, allowedIds: readonly string[]): string[] {
  const next = sanitizeTags(list, allowedIds);
  const cleaned = sanitizeTags([tag], allowedIds)[0];
  if (!cleaned) return next;
  const key = cleaned.toLowerCase();
  if (next.some((item) => item.toLowerCase() === key)) {
    return next.filter((item) => item.toLowerCase() !== key);
  }
  return sanitizeTags([...next, cleaned], allowedIds);
}

export function isPresetTag(tag: string, allowedIds: readonly string[]): boolean {
  return isPreset(tag.toLowerCase().replace(/\s+/g, "_"), allowedIds);
}
