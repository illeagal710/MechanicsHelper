import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BLOCK_AFTER_HOURS_CHOICES,
  DEFAULT_BLOCK_AFTER_HOURS,
  blockHoursFromRecord,
  normalizeBlockAfterHours,
  slotInBlockWindow,
} from "./booking-block.ts";
import { occupiesSlot, slotTakenAmong } from "./job-status.ts";

const S = "2026-09-21T15:00:00.000Z"; // 08:00 PDT / 15:00 UTC — treat as absolute ISO
const PLUS_90 = "2026-09-21T16:30:00.000Z";
const PLUS_180 = "2026-09-21T18:00:00.000Z";
const PLUS_210 = "2026-09-21T18:30:00.000Z";
const PLUS_240 = "2026-09-21T19:00:00.000Z";
const BEFORE = "2026-09-21T13:30:00.000Z";

test("default block after booking is 3 hours; Off/0 through 4 are valid", () => {
  assert.equal(DEFAULT_BLOCK_AFTER_HOURS, 3);
  assert.deepEqual([...BLOCK_AFTER_HOURS_CHOICES], [0, 1, 2, 3, 4]);
  assert.equal(normalizeBlockAfterHours(undefined), 3);
  assert.equal(normalizeBlockAfterHours(null), 3);
  assert.equal(normalizeBlockAfterHours(""), 3);
  assert.equal(normalizeBlockAfterHours("3"), 3);
  assert.equal(normalizeBlockAfterHours(0), 0);
  assert.equal(normalizeBlockAfterHours("0"), 0);
  assert.equal(normalizeBlockAfterHours(4), 4);
  assert.equal(normalizeBlockAfterHours(9), 3);
  assert.equal(normalizeBlockAfterHours(-1), 3);
  assert.equal(blockHoursFromRecord({}), 3);
  assert.equal(blockHoursFromRecord({ blockAfterHours: 1 }), 1);
});

test("exact start is always blocked, including Off/0", () => {
  assert.equal(slotInBlockWindow(S, S, 0), true);
  assert.equal(slotInBlockWindow(S, S, 3), true);
  assert.equal(slotInBlockWindow(S, PLUS_90, 0), false);
});

test("T is blocked when it falls in [S, S + X hours)", () => {
  assert.equal(slotInBlockWindow(S, PLUS_90, 3), true);
  assert.equal(slotInBlockWindow(S, PLUS_180, 3), false); // exclusive end at +3h
  assert.equal(slotInBlockWindow(S, PLUS_210, 3), false);
  assert.equal(slotInBlockWindow(S, PLUS_240, 4), false);
  assert.equal(slotInBlockWindow(S, PLUS_210, 4), true);
  assert.equal(slotInBlockWindow(S, BEFORE, 3), false);
});

test("1h and 2h windows match the advertised choices", () => {
  const plus30 = "2026-09-21T15:30:00.000Z";
  const plus60 = "2026-09-21T16:00:00.000Z";
  const plus90 = PLUS_90;
  assert.equal(slotInBlockWindow(S, plus30, 1), true);
  assert.equal(slotInBlockWindow(S, plus60, 1), false);
  assert.equal(slotInBlockWindow(S, plus90, 1), false);
  assert.equal(slotInBlockWindow(S, plus90, 2), true);
  assert.equal(slotInBlockWindow(S, PLUS_180, 2), false);
});

test("invalid timestamps never occupy a slot", () => {
  assert.equal(slotInBlockWindow("not-a-date", S, 3), false);
  assert.equal(slotInBlockWindow(S, "nope", 3), false);
});

const live = {
  id: "MH-LIVE",
  providerId: "s-main",
  status: "scheduled",
  slot: S,
};

test("active jobs block later open slots on the same bay for X hours", () => {
  assert.equal(slotTakenAmong([live], "s-main", PLUS_90, 3), true);
  assert.equal(slotTakenAmong([live], "s-main", PLUS_180, 3), false);
  assert.equal(slotTakenAmong([live], "other", PLUS_90, 3), false);
  assert.equal(slotTakenAmong([live], "s-main", PLUS_90, 0), false);
});

test("cancelled and declined jobs free the whole block", () => {
  assert.equal(occupiesSlot("cancelled"), false);
  assert.equal(occupiesSlot("declined"), false);
  assert.equal(occupiesSlot("done"), false);
  assert.equal(
    slotTakenAmong([{ ...live, status: "declined" }], "s-main", PLUS_90, 3),
    false,
  );
  assert.equal(
    slotTakenAmong([{ ...live, status: "cancelled" }], "s-main", S, 3),
    false,
  );
});

test("reschedule releases the old block and applies the new one", () => {
  const before = [live];
  assert.equal(slotTakenAmong(before, "s-main", PLUS_90, 3), true);
  const moved = [{ ...live, slot: PLUS_180 }];
  assert.equal(slotTakenAmong(moved, "s-main", PLUS_90, 3), false);
  assert.equal(slotTakenAmong(moved, "s-main", PLUS_210, 3), true);
  assert.equal(slotTakenAmong(moved, "s-main", PLUS_180, 3, "MH-LIVE"), false);
});
