import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ESTIMATE_APPROVED_NOTE,
  ESTIMATE_INVALID,
  FLAG_NOTE,
  NOTHING_TO_UNDO,
  REPAIR_NEEDS_ESTIMATE,
  applyEstimateDecision,
  applyEstimateSend,
  applyOpsToJob,
  applyParts,
  applySkipEstimate,
  applyStatusChange,
  applyStatusUndo,
  appointmentEndIso,
  appointmentIcs,
  canCustomerDecideEstimate,
  canEnterRepair,
  estimateNoteText,
  formatEstimateAmount,
  googleCalendarUrl,
  jobOpsOf,
  mergeJobOps,
  needsStatusConfirm,
  parseEstimateAmount,
  statusActionConfirm,
  parseJobOps,
  partsNoteText,
  serializeJobOps,
  skippedStatuses,
} from "./job-ops.ts";

test("parseEstimateAmount accepts dollars and rejects junk", () => {
  assert.equal(parseEstimateAmount("240"), 240);
  assert.equal(parseEstimateAmount("$1,240.50"), 1240.5);
  assert.equal(parseEstimateAmount("0"), null);
  assert.equal(parseEstimateAmount("abc"), null);
  assert.equal(parseEstimateAmount(""), null);
});

test("written estimate starts sent and customer can approve or decline", () => {
  const sent = applyEstimateSend(240, "Pads and rotors");
  assert.equal(sent.status, "sent");
  assert.equal(canEnterRepair(sent), false);
  assert.equal(canCustomerDecideEstimate(sent), true);
  assert.equal(estimateNoteText(sent), "Written estimate: $240.00. Pads and rotors");
  const ok = applyEstimateDecision(sent, true, 99);
  assert.equal(ok.status, "approved");
  assert.equal(ok.decidedAt, 99);
  assert.equal(canEnterRepair(ok), true);
  assert.equal(canCustomerDecideEstimate(ok), false);
  const no = applyEstimateDecision(sent, false, 100);
  assert.equal(no.status, "declined");
  assert.equal(canEnterRepair(no), false);
});

test("repair is allowed after skipping a written estimate", () => {
  const skipped = applySkipEstimate(5);
  assert.equal(skipped.status, "skipped");
  assert.equal(canEnterRepair(skipped), true);
  assert.equal(canEnterRepair(undefined), false);
});

test("parts line formats ETA for the ticket", () => {
  assert.equal(partsNoteText(applyParts("Fri 2pm", "Dealer rotor")), "Parts ordered · ETA Fri 2pm. Dealer rotor");
  assert.equal(partsNoteText(applyParts("Friday", "")), "Parts ordered · ETA Friday.");
  assert.equal(partsNoteText(applyParts("", "", false)), "Parts not ordered yet.");
});

test("ops_json round-trips estimate, parts, undo pointer, photo, and flag", () => {
  const ops = parseJobOps({
    estimate: { amount: 90, note: "Oil", status: "sent", at: 1 },
    parts: { ordered: true, eta: "Tue", note: "", at: 2 },
    statusBefore: "diagnosing",
    symptomPhoto: "data:symptom",
    flaggedForOwner: true,
  });
  assert.equal(ops.estimate?.amount, 90);
  assert.equal(ops.parts?.eta, "Tue");
  assert.equal(ops.statusBefore, "diagnosing");
  assert.equal(ops.symptomPhoto, "data:symptom");
  assert.equal(ops.flaggedForOwner, true);
  const json = serializeJobOps(ops);
  assert.deepEqual(parseJobOps(json), ops);
  assert.equal(parseJobOps("not-json").estimate, undefined);
  assert.equal(parseJobOps("").flaggedForOwner, undefined);
});

test("mergeJobOps patches without dropping other fields, and nullish clears", () => {
  const base = parseJobOps({
    estimate: { amount: 10, note: "", status: "sent", at: 1 },
    symptomPhoto: "data:a",
    flaggedForOwner: true,
  });
  const merged = mergeJobOps(base, { parts: applyParts("Wed", ""), flaggedForOwner: false });
  assert.equal(merged.estimate?.amount, 10);
  assert.equal(merged.parts?.eta, "Wed");
  assert.equal(merged.symptomPhoto, "data:a");
  assert.equal(merged.flaggedForOwner, undefined);
  const cleared = mergeJobOps(merged, { symptomPhoto: "" });
  assert.equal(cleared.symptomPhoto, undefined);
});

test("applyOpsToJob flattens ops onto a ticket without inventing fields", () => {
  const job = applyOpsToJob(
    { id: "MH-1", status: "diagnosing" },
    { estimate: applyEstimateSend(12, ""), symptomPhoto: "data:x" },
  );
  assert.equal(job.id, "MH-1");
  assert.equal(job.estimate?.amount, 12);
  assert.equal(job.symptomPhoto, "data:x");
  assert.equal(jobOpsOf(job).estimate?.amount, 12);
});

test("status skip detect jumps of more than one pipeline step", () => {
  assert.equal(needsStatusConfirm("scheduled", "enroute"), false);
  assert.equal(needsStatusConfirm("scheduled", "checkedin"), true);
  assert.equal(needsStatusConfirm("repair", "scheduled"), true);
  assert.equal(needsStatusConfirm("parts", "parts"), false);
  assert.deepEqual(skippedStatuses("scheduled", "diagnosing"), ["enroute", "checkedin"]);
  assert.deepEqual(skippedStatuses("diagnosing", "parts"), []);
  assert.deepEqual(skippedStatuses("diagnosing", "repair"), ["parts"]);
});

test("statusActionConfirm asks once: silent next step, one repair dialog, one skip dialog", () => {
  const none = statusActionConfirm("scheduled", "enroute", undefined);
  assert.equal(none.kind, "none");
  const skip = statusActionConfirm("scheduled", "checkedin", undefined);
  assert.equal(skip.kind, "skip");
  const repair = statusActionConfirm("diagnosing", "repair", undefined);
  assert.equal(repair.kind, "repair");
  assert.equal(repair.skipEstimate, true);
  const jumpRepair = statusActionConfirm("scheduled", "repair", undefined);
  assert.equal(jumpRepair.kind, "repair");
  const approved = applyEstimateDecision(applyEstimateSend(10, ""), true);
  assert.equal(statusActionConfirm("parts", "repair", approved).kind, "none");
  assert.equal(statusActionConfirm("diagnosing", "repair", approved).kind, "skip");
});

test("status change remembers the previous step so undo can restore it", () => {
  const next = applyStatusChange({ status: "diagnosing" }, "parts");
  assert.equal(next.status, "parts");
  assert.equal(next.statusBefore, "diagnosing");
  const undone = applyStatusUndo(next);
  assert.equal(undone.ok, true);
  if (undone.ok) {
    assert.equal(undone.job.status, "diagnosing");
    assert.equal(undone.job.statusBefore, undefined);
  }
  const empty = applyStatusUndo({ status: "scheduled" });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.error, NOTHING_TO_UNDO);
});

test("calendar ICS and Google URL use a 90-minute window around the slot", () => {
  const slot = "2026-09-22T16:00:00.000Z";
  const job = {
    id: "MH-4824",
    slot,
    providerName: "Riverside Auto",
    year: "2019",
    make: "Honda",
    model: "CR-V",
    address: "1450 Market St",
  };
  assert.equal(appointmentEndIso(slot), "2026-09-22T17:30:00.000Z");
  const ics = appointmentIcs(job);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART:20260922T160000Z/);
  assert.match(ics, /DTEND:20260922T173000Z/);
  assert.match(ics, /UID:MH-4824@mechanicshelper.app/);
  assert.match(ics, /SUMMARY:Appointment · Riverside Auto/);
  assert.match(ics, /LOCATION:1450 Market St/);
  const gcal = googleCalendarUrl(job);
  assert.match(gcal, /calendar\.google\.com\/calendar\/render/);
  assert.match(gcal, /dates=20260922T160000Z\/20260922T173000Z/);
  assert.match(gcal, /1450/);
});

test("gate copy and note constants stay stable for i18n maps", () => {
  assert.equal(REPAIR_NEEDS_ESTIMATE.startsWith("Send a written estimate"), true);
  assert.equal(ESTIMATE_INVALID, "Enter a dollar amount.");
  assert.equal(ESTIMATE_APPROVED_NOTE, "Customer approved the estimate.");
  assert.equal(FLAG_NOTE, "Flagged for the shop owner.");
  assert.equal(formatEstimateAmount(12), "$12.00");
});
