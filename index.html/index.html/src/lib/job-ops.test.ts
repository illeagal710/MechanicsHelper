import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FLAG_NOTE,
  NOTHING_TO_UNDO,
  applyOpsToJob,
  applyParts,
  applyStatusChange,
  applyStatusUndo,
  appointmentEndIso,
  appointmentIcs,
  googleCalendarUrl,
  jobOpsOf,
  mergeJobOps,
  needsStatusConfirm,
  statusActionConfirm,
  parseJobOps,
  partsNoteText,
  serializeJobOps,
  skippedStatuses,
} from "./job-ops.ts";

test("parts line formats ETA for the ticket", () => {
  assert.equal(partsNoteText(applyParts("Fri 2pm", "Dealer rotor")), "Parts ordered · ETA Fri 2pm. Dealer rotor");
  assert.equal(partsNoteText(applyParts("Friday", "")), "Parts ordered · ETA Friday.");
  assert.equal(partsNoteText(applyParts("", "", false)), "Parts not ordered yet.");
});

test("ops_json keeps invoice and drops a legacy estimate blob", () => {
  const ops = parseJobOps({
    estimate: { amount: 90, note: "Oil", status: "sent", at: 1 },
    parts: { ordered: true, eta: "Tue", note: "", at: 2 },
    statusBefore: "diagnosing",
    symptomPhoto: "data:symptom",
    flaggedForOwner: true,
    invoice: {
      number: "LEON-104",
      lines: [{ description: "Pads", qty: 1, price: 180 }],
      taxPct: 0,
      note: "cash, Venmo",
      paid: false,
      createdAt: 3,
      updatedAt: 4,
    },
  });
  assert.equal("estimate" in ops, false);
  assert.equal(ops.parts?.eta, "Tue");
  assert.equal(ops.statusBefore, "diagnosing");
  assert.equal(ops.symptomPhoto, "data:symptom");
  assert.equal(ops.flaggedForOwner, true);
  assert.equal(ops.invoice?.number, "LEON-104");
  assert.equal(ops.invoice?.lines[0].price, 180);
  const json = serializeJobOps(ops);
  assert.deepEqual(parseJobOps(json), ops);
  assert.equal(JSON.parse(json).estimate, undefined);
  assert.equal(parseJobOps("not-json").invoice, undefined);
  assert.equal(parseJobOps("").flaggedForOwner, undefined);
  assert.equal(parseJobOps("").invoice, undefined);
});

test("mergeJobOps patches without dropping other fields, and nullish clears", () => {
  const base = parseJobOps({
    estimate: { amount: 10, note: "", status: "sent", at: 1 },
    symptomPhoto: "data:a",
    flaggedForOwner: true,
    invoice: {
      number: "RIV4-1",
      lines: [{ description: "Labor", qty: 1, price: 90 }],
      taxPct: 0,
      note: "",
      paid: false,
      createdAt: 1,
      updatedAt: 1,
    },
  });
  const merged = mergeJobOps(base, { parts: applyParts("Wed", ""), flaggedForOwner: false });
  assert.equal("estimate" in merged, false);
  assert.equal(merged.parts?.eta, "Wed");
  assert.equal(merged.symptomPhoto, "data:a");
  assert.equal(merged.flaggedForOwner, undefined);
  assert.equal(merged.invoice?.number, "RIV4-1");
  const cleared = mergeJobOps(merged, { symptomPhoto: "" });
  assert.equal(cleared.symptomPhoto, undefined);
  const partsOnly = mergeJobOps(base, { parts: applyParts("Thu", "") });
  assert.equal(partsOnly.invoice?.number, "RIV4-1");
});

test("applyOpsToJob flattens ops onto a ticket without inventing fields", () => {
  const job = applyOpsToJob(
    { id: "MH-1", status: "diagnosing" },
    { symptomPhoto: "data:x", invoice: {
      number: "LEON-2",
      lines: [{ description: "Oil", qty: 1, price: 40 }],
      taxPct: 0,
      note: "",
      paid: false,
      createdAt: 1,
      updatedAt: 1,
    } },
  );
  assert.equal(job.id, "MH-1");
  assert.equal("estimate" in job, false);
  assert.equal(job.symptomPhoto, "data:x");
  assert.equal(job.invoice?.number, "LEON-2");
  assert.equal(jobOpsOf(job).invoice?.lines[0].price, 40);
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

test("statusActionConfirm is silent on the next step and asks once when skipping", () => {
  const none = statusActionConfirm("scheduled", "enroute");
  assert.equal(none.kind, "none");
  const skip = statusActionConfirm("scheduled", "checkedin");
  assert.equal(skip.kind, "skip");
  assert.equal(statusActionConfirm("parts", "repair").kind, "none");
  assert.equal(statusActionConfirm("diagnosing", "repair").kind, "skip");
  const jumpRepair = statusActionConfirm("scheduled", "repair");
  assert.equal(jumpRepair.kind, "skip");
  if (jumpRepair.kind === "skip") assert.equal(jumpRepair.to, "repair");
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

test("flag note stays stable for the i18n map", () => {
  assert.equal(FLAG_NOTE, "Flagged for the shop owner.");
});
