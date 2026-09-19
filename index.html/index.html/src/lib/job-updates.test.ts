import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeJobsWithLatestUpdate,
  customerFacingNotes,
  isInternalNote,
  isNewProviderNote,
  latestProviderNote,
  notesNewestFirst,
  rankCustomerJobs,
} from "./job-updates.ts";
import type { Job, Note } from "./store.ts";

const booked: Note = { at: 1, text: "Booked online.", by: "system" };
const shopOld: Note = { at: 50, text: "Pads ordered.", by: "shop" };
const shopNew: Note = { at: 90, text: "Rotors are warped", by: "shop" };

const active: Job = {
  id: "MH-1",
  createdAt: 1,
  providerId: "s-1",
  providerType: "shop",
  providerName: "Riverside",
  name: "Maya",
  email: "maya@example.com",
  phone: "555",
  year: "2019",
  make: "Honda",
  model: "CR-V",
  symptoms: "Brakes",
  slot: "2026-09-18T16:00:00.000Z",
  status: "repair",
  notes: [booked, shopOld, shopNew],
};

const done: Job = {
  ...active,
  id: "MH-2",
  status: "done",
  notes: [booked, { at: 40, text: "All set.", by: "shop" }],
};

test("latestProviderNote skips system notes and returns the newest shop note", () => {
  const note = latestProviderNote(active);
  assert.equal(note?.text, "Rotors are warped");
  assert.equal(note?.at, 90);
});

test("notesNewestFirst puts the newest ticket note first", () => {
  const ordered = notesNewestFirst(active.notes);
  assert.equal(ordered[0]?.text, "Rotors are warped");
  assert.equal(ordered.at(-1)?.by, "system");
});

test("activeJobsWithLatestUpdate hides completed tickets and sorts by latest shop note", () => {
  const quiet: Job = { ...active, id: "MH-3", status: "scheduled", notes: [booked] };
  const rows = activeJobsWithLatestUpdate([done, quiet, active]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].job.id, "MH-1");
  assert.equal(rows[0].note.text, "Rotors are warped");
});

test("isNewProviderNote is unread after a later shop note, or recent when never opened", () => {
  assert.equal(isNewProviderNote(shopNew, 50, 100), true);
  assert.equal(isNewProviderNote(shopNew, 90, 100), false);
  assert.equal(isNewProviderNote(shopNew, 0, shopNew.at + 60_000), true);
  assert.equal(isNewProviderNote(shopNew, 0, shopNew.at + 25 * 60 * 60 * 1000), false);
  assert.equal(isNewProviderNote(booked, 0, 100), false);
});

test("rankCustomerJobs puts live tickets with fresh bay notes first", () => {
  const ranked = rankCustomerJobs([done, active]);
  assert.equal(ranked[0].id, "MH-1");
  assert.equal(ranked[1].id, "MH-2");
});

test("internal notes stay off the customer ticket and do not count as bay updates", () => {
  const flagged: Note = { at: 120, text: "Flagged for the shop owner.", by: "internal" };
  const job = { ...active, notes: [...active.notes, flagged] };
  assert.equal(isInternalNote(flagged), true);
  assert.equal(latestProviderNote(job)?.text, "Rotors are warped");
  const visible = customerFacingNotes(job.notes);
  assert.equal(visible.some((n) => n.by === "internal"), false);
  assert.equal(visible.at(-1)?.text, "Rotors are warped");
});
