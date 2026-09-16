import assert from "node:assert/strict";
import { test } from "node:test";
import { appendJobNote, notesJsonForAddNote } from "./job-notes.ts";
import { sanitizeJobPatch, withJobPhoto } from "./photos.ts";
import type { Job, Note } from "./store.ts";

const booked: Note = { at: 1, text: "Booked online.", by: "system" };

const job: Job = {
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
  slot: new Date().toISOString(),
  status: "repair",
  notes: [booked],
  photo: "data:bay",
  jobPhoto: "data:bay",
};

function applySanitizedUpdate(current: Job, patch: Record<string, unknown>): Job {
  const safe = sanitizeJobPatch(patch);
  const next = { ...current };
  if (safe.status) next.status = safe.status;
  if (safe.assignedTo !== undefined) next.assignedTo = safe.assignedTo;
  if (safe.jobPhoto !== undefined) Object.assign(next, withJobPhoto(next, safe.jobPhoto));
  return next;
}

test("addNote persist path appends status auto-notes onto existing ticket notes", () => {
  const notes = appendJobNote(job.notes, "Status set to Ready for pickup", "shop", 50);
  assert.equal(notes.length, 2);
  assert.deepEqual(notes[0], booked);
  assert.equal(notes[1].text, "Status set to Ready for pickup");
  assert.equal(notes[1].by, "shop");
  assert.equal(notes[1].at, 50);
});

test("addNote persist path appends Post update notes onto existing ticket notes", () => {
  const notes = appendJobNote(job.notes, "Pads ordered. Ready Friday.", "shop", 51);
  assert.equal(notes.at(-1)?.text, "Pads ordered. Ready Friday.");
  const json = notesJsonForAddNote(job.notes, "Pads ordered. Ready Friday.", "shop", 51);
  const parsed = JSON.parse(json) as Note[];
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].text, "Pads ordered. Ready Friday.");
});

test("the old updateJob({ notes }) path drops notes at the photo sanitizer", () => {
  const nextNotes = appendJobNote(job.notes, "Status set to Ready for pickup", "shop", 50);
  const broken = applySanitizedUpdate(job, { notes: nextNotes, status: "ready" });
  assert.equal(broken.status, "ready");
  assert.equal(broken.notes.length, 1);
  assert.equal(broken.notes[0].text, "Booked online.");
});

test("status change plus addNote persist path keeps both status and notes", () => {
  const afterStatus = applySanitizedUpdate(job, { status: "ready" });
  const afterNote = {
    ...afterStatus,
    notes: appendJobNote(afterStatus.notes, "Status set to Ready for pickup", "shop", 50),
  };
  assert.equal(afterStatus.status, "ready");
  assert.equal(afterNote.notes.length, 2);
  assert.equal(afterNote.notes[1].text, "Status set to Ready for pickup");
  assert.equal(afterNote.jobPhoto, "data:bay");
});

test("photo sanitizer still blocks profile photo from overwriting the bay slot", () => {
  const afterNote = {
    ...job,
    notes: appendJobNote(job.notes, "Customer update", "shop", 52),
  };
  const leaked = applySanitizedUpdate(afterNote, {
    photo: "data:profile",
    role: "customer",
    bio: "not a bay photo",
    notes: [{ at: 99, text: "should not replace", by: "shop" }],
  });
  assert.equal(leaked.jobPhoto, "data:bay");
  assert.equal(leaked.photo, "data:bay");
  assert.equal(leaked.notes[1].text, "Customer update");
  assert.equal("photo" in sanitizeJobPatch({ photo: "data:profile", role: "shop" }), false);
});

test("jobPhoto-only patches still write the bay slot without touching notes", () => {
  const after = applySanitizedUpdate(job, { jobPhoto: "data:new-bay" });
  assert.equal(after.jobPhoto, "data:new-bay");
  assert.equal(after.photo, "data:new-bay");
  assert.deepEqual(after.notes, job.notes);
});

test("blank addNote text does not wipe existing notes", () => {
  assert.deepEqual(appendJobNote(job.notes, "   "), job.notes);
});
