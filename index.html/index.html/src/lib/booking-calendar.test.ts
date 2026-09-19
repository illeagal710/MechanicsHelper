import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BOOKING_HORIZON_DAYS,
  DEFAULT_SLOT_TIMES,
  SLOT_STEP_MIN,
  addMonths,
  dayKey,
  generateSlots,
  minutesOf,
  monthGrid,
  monthKey,
  slotTimesFromHours,
} from "./booking-calendar.ts";

test("default hours keep the familiar 90-minute bay times", () => {
  assert.equal(SLOT_STEP_MIN, 90);
  assert.equal(BOOKING_HORIZON_DAYS, 28);
  assert.deepEqual(DEFAULT_SLOT_TIMES, ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"]);
  assert.deepEqual(slotTimesFromHours(), DEFAULT_SLOT_TIMES);
  assert.equal(minutesOf("09:30"), 570);
});

test("shop hours filter the classic times; odd windows generate 90-minute steps", () => {
  assert.deepEqual(
    slotTimesFromHours({ hoursOpen: "09:00", hoursClose: "12:00" }),
    ["09:30", "11:00"],
  );
  assert.deepEqual(slotTimesFromHours({ hoursOpen: "14:00", hoursClose: "13:00" }), []);
  assert.deepEqual(
    slotTimesFromHours({ hoursOpen: "07:00", hoursClose: "07:30" }),
    ["07:00"],
  );
});

test("generateSlots includes leftover times today and skips closed Sunday", () => {
  const now = new Date(2026, 8, 19, 10, 0, 0); // Sat Sep 19 2026 10:00
  const slots = generateSlots(now);
  assert.equal(dayKey(slots[0]), "2026-09-19");
  assert.equal(slots[0].getHours(), 11);
  assert.equal(slots[0].getMinutes(), 0);
  assert.ok(slots.every((d) => d.getDay() !== 0));
  assert.ok(slots.every((d) => d.getTime() > now.getTime()));
  const last = slots.at(-1)!;
  const horizon = new Date(2026, 8, 19 + BOOKING_HORIZON_DAYS);
  assert.ok(last.getTime() <= new Date(horizon.getFullYear(), horizon.getMonth(), horizon.getDate(), 23, 59).getTime());
  assert.ok(slots.length > 6 * 7, "28-day window is longer than a single week");
});

test("Mon–Fri shops do not offer Saturday or Sunday", () => {
  const now = new Date(2026, 8, 18, 7, 0, 0); // Fri
  const slots = generateSlots(now, { hoursDays: "12345", hoursOpen: "08:00", hoursClose: "16:00" });
  assert.ok(slots.every((d) => d.getDay() >= 1 && d.getDay() <= 5));
});

test("month grid is Sunday-start and covers the whole month", () => {
  const cells = monthGrid(2026, 8); // September 2026, Tue the 1st
  assert.equal(cells[0].key, "2026-08-30");
  assert.equal(cells[0].inMonth, false);
  const first = cells.find((c) => c.key === "2026-09-01");
  assert.ok(first);
  assert.equal(first!.inMonth, true);
  assert.equal(first!.day, 1);
  assert.ok(cells.some((c) => c.key === "2026-09-30" && c.inMonth));
  assert.equal(cells.length % 7, 0);
  assert.equal(monthKey(2026, 8), "2026-09");
  assert.deepEqual(addMonths(2026, 8, 1), { year: 2026, month: 9 });
  assert.deepEqual(addMonths(2026, 0, -1), { year: 2025, month: 11 });
});
