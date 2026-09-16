/**
 * Booking symptoms / description are optional.
 * Empty string and a missing field must not block a booking.
 */
export function normalizeSymptoms(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

/** Required booking fields. Symptoms is intentionally not in this list. */
export function missingRequiredBookingFields(input: {
  year?: unknown;
  make?: unknown;
  model?: unknown;
  slot?: unknown;
  symptoms?: unknown;
}): string[] {
  const missing: string[] = [];
  if (!input.year) missing.push("year");
  if (!input.make) missing.push("make");
  if (!input.model) missing.push("model");
  if (!input.slot) missing.push("slot");
  return missing;
}
