import { PIPELINE_STATUSES, type PipelineStatus } from "./job-status.ts";

export const APPOINTMENT_MINUTES = 90;

export const REPAIR_NEEDS_ESTIMATE =
  "Send a written estimate or confirm you are going in without one.";
export const ESTIMATE_INVALID = "Enter a dollar amount.";
export const ESTIMATE_NOT_PENDING = "There is no estimate waiting on this ticket.";
export const NOTHING_TO_UNDO = "Nothing to undo.";
export const ESTIMATE_APPROVED_NOTE = "Customer approved the estimate.";
export const ESTIMATE_DECLINED_NOTE = "Customer declined the estimate.";
export const ESTIMATE_SKIPPED_NOTE = "Work started without a written estimate.";
export const FLAG_NOTE = "Flagged for the shop owner.";
export const UNFLAG_NOTE = "Owner flag cleared.";

export const ESTIMATE_STATUSES = ["sent", "approved", "declined", "skipped"] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export type JobEstimate = {
  amount: number;
  note: string;
  status: EstimateStatus;
  at: number;
  decidedAt?: number;
};

export type JobParts = {
  ordered: boolean;
  eta: string;
  note: string;
  at: number;
};

export type JobOps = {
  estimate?: JobEstimate;
  parts?: JobParts;
  statusBefore?: string;
  symptomPhoto?: string;
  flaggedForOwner?: boolean;
};

export function isEstimateStatus(value: unknown): value is EstimateStatus {
  return typeof value === "string" && (ESTIMATE_STATUSES as readonly string[]).includes(value);
}

export function parseEstimateAmount(raw: unknown): number | null {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 100) / 100;
}

export function formatEstimateAmount(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function estimateNoteText(estimate: Pick<JobEstimate, "amount" | "note">): string {
  const dollars = formatEstimateAmount(estimate.amount);
  const extra = String(estimate.note || "").trim();
  return extra ? `Written estimate: ${dollars}. ${extra}` : `Written estimate: ${dollars}.`;
}

export function partsNoteText(parts: Pick<JobParts, "eta" | "note" | "ordered">): string {
  if (!parts.ordered) return "Parts not ordered yet.";
  const eta = String(parts.eta || "").trim();
  const extra = String(parts.note || "").trim();
  if (eta && extra) return `Parts ordered · ETA ${eta}. ${extra}`;
  if (eta) return `Parts ordered · ETA ${eta}.`;
  if (extra) return `Parts ordered. ${extra}`;
  return "Parts ordered.";
}

export function parseJobOps(raw: unknown): JobOps {
  let obj: Record<string, unknown> = {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  }

  const out: JobOps = {};
  if (obj.estimate && typeof obj.estimate === "object") {
    const e = obj.estimate as Record<string, unknown>;
    const amount = Number(e.amount);
    if (Number.isFinite(amount) && amount > 0 && isEstimateStatus(e.status)) {
      const decidedAt = Number(e.decidedAt);
      out.estimate = {
        amount: Math.round(amount * 100) / 100,
        note: String(e.note || ""),
        status: e.status,
        at: Number(e.at) || 0,
        ...(Number.isFinite(decidedAt) && decidedAt > 0 ? { decidedAt } : {}),
      };
    }
  }
  if (obj.parts && typeof obj.parts === "object") {
    const p = obj.parts as Record<string, unknown>;
    out.parts = {
      ordered: p.ordered !== false && p.ordered !== "f" && p.ordered !== 0,
      eta: String(p.eta || ""),
      note: String(p.note || ""),
      at: Number(p.at) || 0,
    };
  }
  if (typeof obj.statusBefore === "string" && obj.statusBefore) {
    out.statusBefore = obj.statusBefore;
  }
  if (typeof obj.symptomPhoto === "string" && obj.symptomPhoto.trim()) {
    out.symptomPhoto = obj.symptomPhoto;
  }
  if (obj.flaggedForOwner === true || obj.flaggedForOwner === "t" || obj.flaggedForOwner === 1) {
    out.flaggedForOwner = true;
  }
  return out;
}

export function jobOpsOf(job: Partial<JobOps> | null | undefined): JobOps {
  if (!job) return {};
  return parseJobOps({
    estimate: job.estimate,
    parts: job.parts,
    statusBefore: job.statusBefore,
    symptomPhoto: job.symptomPhoto,
    flaggedForOwner: job.flaggedForOwner,
  });
}

export function mergeJobOps(current: JobOps, patch: Partial<JobOps>): JobOps {
  const next: JobOps = { ...current };
  if ("estimate" in patch) {
    if (patch.estimate) next.estimate = patch.estimate;
    else delete next.estimate;
  }
  if ("parts" in patch) {
    if (patch.parts) next.parts = patch.parts;
    else delete next.parts;
  }
  if ("statusBefore" in patch) {
    if (patch.statusBefore) next.statusBefore = patch.statusBefore;
    else delete next.statusBefore;
  }
  if ("symptomPhoto" in patch) {
    if (patch.symptomPhoto) next.symptomPhoto = patch.symptomPhoto;
    else delete next.symptomPhoto;
  }
  if ("flaggedForOwner" in patch) {
    if (patch.flaggedForOwner) next.flaggedForOwner = true;
    else delete next.flaggedForOwner;
  }
  return next;
}

export function serializeJobOps(ops: JobOps): string {
  const out: JobOps = {};
  if (ops.estimate) out.estimate = ops.estimate;
  if (ops.parts) out.parts = ops.parts;
  if (ops.statusBefore) out.statusBefore = ops.statusBefore;
  if (ops.symptomPhoto) out.symptomPhoto = ops.symptomPhoto;
  if (ops.flaggedForOwner) out.flaggedForOwner = true;
  return JSON.stringify(out);
}

export function applyOpsToJob<T extends object>(job: T, ops: JobOps): T & JobOps {
  return {
    ...job,
    estimate: ops.estimate,
    parts: ops.parts,
    statusBefore: ops.statusBefore,
    symptomPhoto: ops.symptomPhoto,
    flaggedForOwner: ops.flaggedForOwner,
  };
}

export function canEnterRepair(estimate: JobEstimate | undefined): boolean {
  return estimate?.status === "approved" || estimate?.status === "skipped";
}

export function canCustomerDecideEstimate(estimate: JobEstimate | undefined): boolean {
  return estimate?.status === "sent";
}

export function applyEstimateSend(amount: number, note: string, at = Date.now()): JobEstimate {
  return { amount, note: String(note || "").trim(), status: "sent", at };
}

export function applyEstimateDecision(
  estimate: JobEstimate,
  approved: boolean,
  at = Date.now(),
): JobEstimate {
  return {
    ...estimate,
    status: approved ? "approved" : "declined",
    decidedAt: at,
  };
}

export function applySkipEstimate(at = Date.now()): JobEstimate {
  return { amount: 0, note: "", status: "skipped", at, decidedAt: at };
}

export function applyParts(eta: string, note: string, ordered = true, at = Date.now()): JobParts {
  return {
    ordered,
    eta: String(eta || "").trim(),
    note: String(note || "").trim(),
    at,
  };
}

export function pipelineIndex(status: string): number {
  return (PIPELINE_STATUSES as readonly string[]).indexOf(status);
}

/** Intermediate pipeline steps skipped when jumping from `from` to `to`. */
export function skippedStatuses(from: string, to: string): PipelineStatus[] {
  const a = pipelineIndex(from);
  const b = pipelineIndex(to);
  if (a < 0 || b < 0 || b <= a + 1) return [];
  return PIPELINE_STATUSES.slice(a + 1, b);
}

/** True when the shop is jumping more than one pipeline step (forward or back). */
export function needsStatusConfirm(from: string, to: string): boolean {
  const a = pipelineIndex(from);
  const b = pipelineIndex(to);
  if (a < 0 || b < 0 || a === b) return false;
  return Math.abs(b - a) > 1;
}

export function applyStatusChange<T extends { status: string }>(
  job: T,
  nextStatus: string,
): T & { statusBefore?: string } {
  if (job.status === nextStatus) return job;
  return { ...job, statusBefore: job.status, status: nextStatus };
}

export function applyStatusUndo<T extends { status: string; statusBefore?: string }>(
  job: T,
): { ok: true; job: T & { statusBefore?: string } } | { ok: false; error: string } {
  const prev = String(job.statusBefore || "");
  if (!prev) return { ok: false, error: NOTHING_TO_UNDO };
  return { ok: true, job: { ...job, status: prev, statusBefore: undefined } };
}

function icsUtc(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function appointmentEndIso(slotIso: string, minutes = APPOINTMENT_MINUTES): string {
  const d = new Date(slotIso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Date(d.getTime() + minutes * 60_000).toISOString();
}

function icsEscape(value: string): string {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export type CalendarJob = {
  id: string;
  slot: string;
  providerName: string;
  year?: string;
  make?: string;
  model?: string;
  address?: string;
};

export function appointmentIcs(job: CalendarJob): string {
  const start = icsUtc(job.slot);
  const end = icsUtc(appointmentEndIso(job.slot));
  const stamp = icsUtc(new Date().toISOString());
  const car = `${job.year || ""} ${job.make || ""} ${job.model || ""}`.trim();
  const summary = icsEscape(`Appointment · ${job.providerName}`);
  const desc = icsEscape(`Mechanics Helper ${job.id}${car ? ` · ${car}` : ""}`);
  const loc = icsEscape(job.address || job.providerName);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mechanics Helper//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${job.id}@mechanicshelper.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    loc ? `LOCATION:${loc}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line) => line !== "");
  return lines.join("\r\n") + "\r\n";
}

export function googleCalendarUrl(job: CalendarJob): string {
  const text = encodeURIComponent(`Appointment · ${job.providerName}`);
  const dates = `${icsUtc(job.slot)}/${icsUtc(appointmentEndIso(job.slot))}`;
  const car = `${job.year || ""} ${job.make || ""} ${job.model || ""}`.trim();
  const details = encodeURIComponent(`Mechanics Helper ${job.id}${car ? ` · ${car}` : ""}`);
  const location = encodeURIComponent(job.address || job.providerName);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

export function icsDataUri(ics: string): string {
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
}

export function downloadIcs(filename: string, ics: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
