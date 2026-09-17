import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeJobPatch } from "./photos.ts";
import {
  CANNOT_DECLINE,
  PIPELINE_STATUSES,
  activeJobs,
  applyDecline,
  canDeclineStatus,
  declineMailPlan,
  declineNoteText,
  declineReasonFromNotes,
  declinedMailContent,
  historyJobs,
  isTerminalStatus,
  jobMatchesQuery,
  occupiesSlot,
  parseDeclineNote,
  searchJobs,
  shopBoardJobs,
  slotTakenAmong,
} from "./job-status.ts";
import type { JobLike } from "./job-status.ts";

function job(partial: Partial<JobLike> & Pick<JobLike, "id" | "status">): JobLike {
  return {
    name: "Maya Chen",
    email: "maya@example.com",
    year: "2019",
    make: "Honda",
    model: "CR-V",
    slot: "2026-09-18T16:00:00.000Z",
    createdAt: 1,
    providerId: "s-main",
    providerName: "Riverside Auto",
    notes: [{ at: 1, text: "Booked online.", by: "system" }],
    ...partial,
  };
}

test("pipeline statuses do not include declined; declined and done are terminal", () => {
  assert.deepEqual([...PIPELINE_STATUSES], [
    "scheduled",
    "enroute",
    "checkedin",
    "diagnosing",
    "parts",
    "repair",
    "ready",
    "done",
  ]);
  assert.equal(isTerminalStatus("done"), true);
  assert.equal(isTerminalStatus("declined"), true);
  assert.equal(isTerminalStatus("scheduled"), false);
  assert.equal(isTerminalStatus("ready"), false);
  assert.equal(occupiesSlot("scheduled"), true);
  assert.equal(occupiesSlot("done"), false);
  assert.equal(occupiesSlot("declined"), false);
});

test("shop board hides done and declined from Open; History lists them", () => {
  const jobs = [
    job({ id: "MH-OPEN", status: "repair", slot: "2026-09-18T16:00:00.000Z" }),
    job({ id: "MH-READY", status: "ready", slot: "2026-09-17T15:00:00.000Z" }),
    job({ id: "MH-DONE", status: "done", slot: "2026-09-10T15:00:00.000Z", createdAt: 10 }),
    job({ id: "MH-DECL", status: "declined", slot: "2026-09-12T15:00:00.000Z", createdAt: 20 }),
  ];
  assert.deepEqual(
    activeJobs(jobs).map((j) => j.id),
    ["MH-READY", "MH-OPEN"],
  );
  assert.deepEqual(
    shopBoardJobs(jobs, "active").map((j) => j.id),
    ["MH-READY", "MH-OPEN"],
  );
  assert.deepEqual(
    shopBoardJobs(jobs, "ready").map((j) => j.id),
    ["MH-READY"],
  );
  assert.deepEqual(
    historyJobs(jobs).map((j) => j.id),
    ["MH-DECL", "MH-DONE"],
  );
  assert.deepEqual(
    shopBoardJobs(jobs, "history").map((j) => j.id),
    ["MH-DECL", "MH-DONE"],
  );
  assert.equal(
    shopBoardJobs(jobs, "history").every((j) => j.status === "done" || j.status === "declined"),
    true,
  );
});

test("slotTaken ignores done and declined so the time slot is free again", () => {
  const slot = "2026-09-18T16:00:00.000Z";
  const sameSlot = [
    job({ id: "MH-DONE", status: "done", slot }),
    job({ id: "MH-DECL", status: "declined", slot, providerId: "s-main" }),
  ];
  assert.equal(slotTakenAmong(sameSlot, "s-main", slot), false);
  assert.equal(
    slotTakenAmong([job({ id: "MH-LIVE", status: "scheduled", slot })], "s-main", slot),
    true,
  );
  assert.equal(
    slotTakenAmong([job({ id: "MH-LIVE", status: "scheduled", slot })], "other", slot),
    false,
  );
});

test("only incoming/scheduled bookings can be declined", () => {
  assert.equal(canDeclineStatus("scheduled"), true);
  assert.equal(canDeclineStatus("enroute"), true);
  assert.equal(canDeclineStatus("checkedin"), false);
  assert.equal(canDeclineStatus("repair"), false);
  assert.equal(canDeclineStatus("done"), false);
  assert.equal(canDeclineStatus("declined"), false);
});

test("applyDecline sets declined, appends a note, and plans customer email", () => {
  const before = job({ id: "MH-4823", status: "scheduled" });
  const declined = applyDecline(before, "Bay is full that morning.", 99);
  assert.equal(declined.ok, true);
  if (!declined.ok) return;
  assert.equal(declined.job.status, "declined");
  assert.equal(declined.note, "Booking declined: Bay is full that morning.");
  assert.equal(declined.job.notes?.at(-1)?.text, declined.note);
  assert.equal(declined.job.notes?.at(-1)?.at, 99);
  assert.equal(before.status, "scheduled");
  assert.equal(declined.mail.send, true);
  if (declined.mail.send) {
    assert.equal(declined.mail.to, "maya@example.com");
    assert.match(declined.mail.subject, /MH-4823/);
    assert.match(declined.mail.text, /Bay is full that morning/);
    assert.match(declined.mail.text, /rechazó tu cita/);
    assert.match(declined.mail.text, /Riverside Auto declined/);
  }
});

test("applyDecline without a reason still notifies; missing email skips mail", () => {
  const withEmail = applyDecline(job({ id: "MH-1", status: "scheduled" }), "  ");
  assert.equal(withEmail.ok, true);
  if (withEmail.ok) {
    assert.equal(withEmail.note, "Booking declined.");
    assert.equal(withEmail.mail.send, true);
  }
  const noEmail = applyDecline(job({ id: "MH-2", status: "enroute", email: "" }), "No bay");
  assert.equal(noEmail.ok, true);
  if (noEmail.ok) {
    assert.deepEqual(noEmail.mail, { send: false, skip: "no-email" });
    assert.equal(declineMailPlan(noEmail.job, "No bay").send, false);
  }
});

test("applyDecline refuses mid-repair tickets", () => {
  const blocked = applyDecline(job({ id: "MH-REPAIR", status: "repair" }), "Nope");
  assert.deepEqual(blocked, { ok: false, error: CANNOT_DECLINE });
});

test("sanitizeJobPatch accepts declined as a ticket status", () => {
  assert.equal(sanitizeJobPatch({ status: "declined" }).status, "declined");
  assert.equal(sanitizeJobPatch({ status: "done" }).status, "done");
  assert.equal(sanitizeJobPatch({ status: "cancelled" }).status, undefined);
});

test("decline note parse round-trips for EN ticket display", () => {
  assert.deepEqual(parseDeclineNote("Booking declined."), { declined: true, reason: "" });
  assert.deepEqual(parseDeclineNote("Booking declined: No tech that day."), {
    declined: true,
    reason: "No tech that day.",
  });
  assert.equal(parseDeclineNote("Status set to Scheduled"), null);
  assert.equal(declineNoteText("  pads wait  "), "Booking declined: pads wait");
  const notes = applyDecline(job({ id: "MH-1", status: "scheduled" }), "Full", 5);
  assert.equal(notes.ok, true);
  if (notes.ok) {
    assert.equal(declineReasonFromNotes(notes.job.notes), "Full");
  }
});

const searchJob = {
  id: "MH-4821",
  name: "Maya Chen",
  email: "maya@example.com",
  phone: "5550148821",
  year: "2019",
  make: "Honda",
  model: "CR-V",
  trim: "EX-L",
  assignedTo: "Alex Ruiz",
};

test("board search matches id, name, vehicle, tech, and email", () => {
  assert.equal(jobMatchesQuery(searchJob, "mh-4821"), true);
  assert.equal(jobMatchesQuery(searchJob, "maya"), true);
  assert.equal(jobMatchesQuery(searchJob, "honda"), true);
  assert.equal(jobMatchesQuery(searchJob, "cr-v"), true);
  assert.equal(jobMatchesQuery(searchJob, "alex"), true);
  assert.equal(jobMatchesQuery(searchJob, "example.com"), true);
  assert.equal(jobMatchesQuery(searchJob, "porsche"), false);
});

test("board search matches customer phone by digits (3+)", () => {
  assert.equal(jobMatchesQuery(searchJob, "8821"), true);
  assert.equal(jobMatchesQuery(searchJob, "(555) 014"), true);
  assert.equal(jobMatchesQuery(searchJob, "12"), false); // too short to phone-match
});

test("searchJobs filters a list and keeps order; blank returns all", () => {
  const other = { ...searchJob, id: "MH-9000", name: "Sam Lee", make: "Toyota", model: "Camry", phone: "5550000000", trim: "" };
  const list = [searchJob, other];
  assert.deepEqual(searchJobs(list, ""), list);
  assert.deepEqual(searchJobs(list, "  "), list);
  assert.deepEqual(searchJobs(list, "toyota"), [other]);
  assert.deepEqual(searchJobs(list, "honda"), [searchJob]);
  assert.deepEqual(searchJobs(list, "zzz"), []);
});

test("declined mail body stays bilingual and includes job id", () => {
  const mail = declinedMailContent(job({ id: "MH-9", status: "scheduled" }), "Closed that day");
  assert.match(mail.subject, /booking declined \(MH-9\)/);
  assert.match(mail.text, /Closed that day/);
  assert.match(mail.text, /Motivo: Closed that day/);
  assert.match(mail.text, /Open Mechanics Helper/);
  assert.match(mail.text, /Abre Mechanics Helper/);
});
