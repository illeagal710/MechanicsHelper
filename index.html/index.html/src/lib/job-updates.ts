import type { Job, Note } from "@/lib/store";
import { isTerminalStatus } from "./job-status.ts";

export const RECENT_NOTE_MS = 24 * 60 * 60 * 1000;

export function isProviderNote(note: Note | null | undefined): boolean {
  return !!note && note.by === "shop";
}

export function isInternalNote(note: Note | null | undefined): boolean {
  return !!note && note.by === "internal";
}

/** Customers never see bay-only notes (flag for owner, internal chatter). */
export function isCustomerVisibleNote(note: Note | null | undefined): boolean {
  return !!note && !isInternalNote(note);
}

export function customerFacingNotes(notes: Note[] | undefined): Note[] {
  return (notes || []).filter(isCustomerVisibleNote);
}

export function latestProviderNote(job: Pick<Job, "notes"> | null | undefined): Note | null {
  const notes = [...(job?.notes || [])].filter(isProviderNote);
  if (!notes.length) return null;
  return notes.sort((a, b) => b.at - a.at)[0] || null;
}

export function notesNewestFirst(notes: Note[] | undefined): Note[] {
  return [...(notes || [])].sort((a, b) => b.at - a.at);
}

export function isRecentNote(note: Pick<Note, "at">, now = Date.now()): boolean {
  return now - note.at <= RECENT_NOTE_MS;
}

export function seenNotesKey(userId: string, jobId: string): string {
  return `mh.seenNote.${userId}.${jobId}`;
}

export function readSeenNoteAt(userId: string, jobId: string): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(seenNotesKey(userId, jobId));
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function markNotesSeen(userId: string, jobId: string, at: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(seenNotesKey(userId, jobId), String(at));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Unread if newer than last open; if never opened, recent provider notes count as new. */
export function isNewProviderNote(note: Note, seenAt: number, now = Date.now()): boolean {
  if (!isProviderNote(note)) return false;
  if (seenAt > 0) return note.at > seenAt;
  return isRecentNote(note, now);
}

export function activeJobsWithLatestUpdate<T extends Pick<Job, "status" | "notes">>(
  jobs: T[],
): { job: T; note: Note }[] {
  return jobs
    .filter((j) => !isTerminalStatus(j.status))
    .map((job) => {
      const note = latestProviderNote(job);
      return note ? { job, note } : null;
    })
    .filter((row): row is { job: T; note: Note } => !!row)
    .sort((a, b) => b.note.at - a.note.at);
}

export function rankCustomerJobs<T extends Pick<Job, "status" | "notes" | "slot">>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const aDone = isTerminalStatus(a.status) ? 1 : 0;
    const bDone = isTerminalStatus(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aNote = latestProviderNote(a)?.at || 0;
    const bNote = latestProviderNote(b)?.at || 0;
    if (aNote !== bNote) return bNote - aNote;
    return +new Date(a.slot) - +new Date(b.slot);
  });
}
