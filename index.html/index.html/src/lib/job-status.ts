/** Repair pipeline statuses. `declined` is terminal and not on this list. */
export const PIPELINE_STATUSES = [
  "scheduled",
  "enroute",
  "checkedin",
  "diagnosing",
  "parts",
  "repair",
  "ready",
  "done",
] as const;

export const TERMINAL_STATUSES = ["done", "declined"] as const;

/** Incoming bookings the shop can decline (not mid-repair). */
export const DECLINABLE_STATUSES = ["scheduled", "enroute"] as const;

export const ALL_STATUSES = [...PIPELINE_STATUSES, "declined"] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];
export type DeclinedStatus = "declined";
export type JobStatusId = (typeof ALL_STATUSES)[number];

export type ShopBoardFilter = "active" | "ready" | "history";

export type JobLike = {
  id: string;
  name: string;
  email?: string;
  year: string;
  make: string;
  model: string;
  slot: string;
  createdAt: number;
  status: string;
  providerId: string;
  providerName: string;
  notes?: { at: number; text: string; by: string }[];
};

export function isJobStatus(value: unknown): value is JobStatusId {
  return typeof value === "string" && (ALL_STATUSES as readonly string[]).includes(value);
}

export function isPipelineStatus(value: string): value is PipelineStatus {
  return (PIPELINE_STATUSES as readonly string[]).includes(value);
}

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function occupiesSlot(status: string): boolean {
  return !isTerminalStatus(status);
}

export function canDeclineStatus(status: string): boolean {
  return (DECLINABLE_STATUSES as readonly string[]).includes(status);
}

export function jobOccupiesSlot(
  job: Pick<JobLike, "providerId" | "status" | "slot">,
  providerId: string | undefined,
  slotIso: string,
): boolean {
  if (!providerId || job.providerId !== providerId) return false;
  if (!occupiesSlot(job.status)) return false;
  const t = new Date(slotIso).getTime();
  if (!Number.isFinite(t)) return false;
  return new Date(job.slot).getTime() === t;
}

export function slotTakenAmong(
  jobs: Pick<JobLike, "providerId" | "status" | "slot">[],
  providerId: string | undefined,
  slotIso: string,
): boolean {
  if (!providerId) return false;
  return jobs.some((j) => jobOccupiesSlot(j, providerId, slotIso));
}

export function activeJobs<T extends Pick<JobLike, "status" | "slot">>(jobs: T[]): T[] {
  return jobs.filter((j) => !isTerminalStatus(j.status)).sort((a, b) => +new Date(a.slot) - +new Date(b.slot));
}

export function historyJobs<T extends Pick<JobLike, "status" | "slot" | "createdAt">>(jobs: T[]): T[] {
  return jobs
    .filter((j) => isTerminalStatus(j.status))
    .sort((a, b) => +new Date(b.slot) - +new Date(a.slot) || b.createdAt - a.createdAt);
}

export function shopBoardJobs<T extends Pick<JobLike, "status" | "slot" | "createdAt">>(
  jobs: T[],
  filter: ShopBoardFilter,
): T[] {
  if (filter === "ready") {
    return jobs.filter((j) => j.status === "ready").sort((a, b) => +new Date(a.slot) - +new Date(b.slot));
  }
  if (filter === "history") return historyJobs(jobs);
  return activeJobs(jobs);
}

/** Fields the provider board search looks through. */
export type JobSearchable = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  assignedTo?: string;
};

/**
 * Whether a job matches a free-text board search: ticket id, customer name,
 * email, vehicle (year/make/model/trim), or assigned tech match on substring;
 * a 3+ digit query also matches the customer phone by digits.
 */
export function jobMatchesQuery(job: JobSearchable, query: string): boolean {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [job.id, job.name, job.email, job.year, job.make, job.model, job.trim, job.assignedTo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return true;
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 3) {
    const phone = String(job.phone || "").replace(/\D/g, "");
    if (phone.includes(digits)) return true;
  }
  return false;
}

/** Filter a board list by a free-text query, preserving order. Blank = all. */
export function searchJobs<T extends JobSearchable>(jobs: T[], query: string): T[] {
  if (!String(query || "").trim()) return jobs;
  return jobs.filter((j) => jobMatchesQuery(j, query));
}

export const CANNOT_DECLINE = "Only incoming or scheduled bookings can be declined.";
export const DECLINE_NOTE = "Booking declined.";
export const DECLINE_NOTE_PREFIX = "Booking declined: ";

export function declineNoteText(reason?: string): string {
  const clean = String(reason || "").trim();
  return clean ? DECLINE_NOTE_PREFIX + clean : DECLINE_NOTE;
}

export function parseDeclineNote(text: string): { declined: true; reason: string } | null {
  const raw = String(text || "");
  if (raw === DECLINE_NOTE) return { declined: true, reason: "" };
  if (raw.startsWith(DECLINE_NOTE_PREFIX)) {
    return { declined: true, reason: raw.slice(DECLINE_NOTE_PREFIX.length) };
  }
  return null;
}

export function declineReasonFromNotes(notes: JobLike["notes"] | undefined): string {
  const found = [...(notes || [])].reverse().find((n) => parseDeclineNote(n.text));
  return found ? parseDeclineNote(found.text)?.reason || "" : "";
}

export type DeclineMailPlan =
  | { send: true; to: string; subject: string; text: string }
  | { send: false; skip: "no-email" };

export function declinedMailContent(job: JobLike, reason?: string): { subject: string; text: string } {
  const car = `${job.year} ${job.make} ${job.model}`.trim() || "vehicle";
  const shop = job.providerName || "Your shop";
  const clean = String(reason || "").trim();
  const reasonEn = clean ? `\nReason: ${clean}` : "";
  const reasonEs = clean ? `\nMotivo: ${clean}` : "";
  return {
    subject: `Mechanics Helper: booking declined (${job.id})`,
    text:
      `${shop} declined your appointment for your ${car} (job ${job.id}).${reasonEn}\n\n` +
      `${shop} rechazó tu cita para tu ${car} (trabajo ${job.id}).${reasonEs}\n\n` +
      `Open Mechanics Helper to see the ticket.\nAbre Mechanics Helper para ver el ticket.`,
  };
}

export function declineMailPlan(job: JobLike, reason?: string): DeclineMailPlan {
  const to = String(job.email || "").trim();
  if (!to || !to.includes("@")) return { send: false, skip: "no-email" };
  const mail = declinedMailContent(job, reason);
  return { send: true, to, ...mail };
}

export type DeclineResult<T extends JobLike> =
  | { ok: true; job: T; note: string; mail: DeclineMailPlan }
  | { ok: false; error: string };

export function applyDecline<T extends JobLike>(job: T, reason = "", at = Date.now()): DeclineResult<T> {
  if (!canDeclineStatus(job.status)) {
    return { ok: false, error: CANNOT_DECLINE };
  }
  const note = declineNoteText(reason);
  const next: T = {
    ...job,
    status: "declined",
    notes: [...(job.notes || []), { at, text: note, by: "shop" }],
  };
  return { ok: true, job: next, note, mail: declineMailPlan(next, reason) };
}
