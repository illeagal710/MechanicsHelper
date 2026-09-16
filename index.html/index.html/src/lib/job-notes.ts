import type { Note } from "@/lib/store";

/**
 * Server-only note append. Ticket notes must not ride on `updateJob` /
 * `sanitizeJobPatch` (those strip unknown keys so a profile `photo` cannot
 * overwrite the bay slot). Persist via `notes_json` in `addNote`.
 */
export function appendJobNote(
  notes: Note[] | undefined,
  text: string,
  by = "shop",
  at = Date.now(),
): Note[] {
  const clean = String(text || "").trim();
  const who = String(by || "shop") || "shop";
  if (!clean) return [...(notes || [])];
  return [...(notes || []), { at, text: clean, by: who }];
}

export function notesJsonForAddNote(
  notes: Note[] | undefined,
  text: string,
  by = "shop",
  at = Date.now(),
): string {
  return JSON.stringify(appendJobNote(notes, text, by, at));
}
