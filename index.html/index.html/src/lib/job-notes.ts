import type { Note } from "@/lib/store";

/** Ignore a second Post of the same text by the same author within this window. */
export const DUPLICATE_NOTE_WINDOW_MS = 45_000;

export type AppendNoteSkip = false | "empty" | "duplicate";

export type AppendNoteResult = {
  notes: Note[];
  skipped: AppendNoteSkip;
};

/**
 * Same text, same author, posted again within ~45s — the shop thought Post
 * did not work and tapped it two or three times.
 */
export function shouldSkipDuplicateNote(
  notes: Note[] | undefined,
  text: string,
  by = "shop",
  at = Date.now(),
  windowMs = DUPLICATE_NOTE_WINDOW_MS,
): boolean {
  const clean = String(text || "").trim();
  const who = String(by || "shop") || "shop";
  if (!clean) return false;
  const last = [...(notes || [])].reverse().find((n) => n.by === who);
  if (!last) return false;
  if (last.text !== clean) return false;
  return at - last.at <= windowMs;
}

export function appendJobNoteResult(
  notes: Note[] | undefined,
  text: string,
  by = "shop",
  at = Date.now(),
): AppendNoteResult {
  const existing = [...(notes || [])];
  const clean = String(text || "").trim();
  const who = String(by || "shop") || "shop";
  if (!clean) return { notes: existing, skipped: "empty" };
  if (shouldSkipDuplicateNote(existing, clean, who, at)) {
    return { notes: existing, skipped: "duplicate" };
  }
  return { notes: [...existing, { at, text: clean, by: who }], skipped: false };
}

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
  return appendJobNoteResult(notes, text, by, at).notes;
}

export function notesJsonForAddNote(
  notes: Note[] | undefined,
  text: string,
  by = "shop",
  at = Date.now(),
): string {
  return JSON.stringify(appendJobNote(notes, text, by, at));
}
