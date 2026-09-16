import assert from "node:assert/strict";
import { test } from "node:test";
import { missingRequiredBookingFields, normalizeSymptoms } from "./booking.ts";

test("empty or missing symptoms normalize to an empty string", () => {
  assert.equal(normalizeSymptoms(""), "");
  assert.equal(normalizeSymptoms(null), "");
  assert.equal(normalizeSymptoms(undefined), "");
  assert.equal(normalizeSymptoms("  "), "  ");
  assert.equal(normalizeSymptoms("Grinds when braking"), "Grinds when braking");
});

test("empty or missing symptoms do not appear as a required booking field", () => {
  assert.deepEqual(
    missingRequiredBookingFields({
      year: "2018",
      make: "Honda",
      model: "Civic",
      slot: "2026-09-17T15:00:00.000Z",
      symptoms: "",
    }),
    [],
  );
  assert.deepEqual(
    missingRequiredBookingFields({
      year: "2018",
      make: "Honda",
      model: "Civic",
      slot: "2026-09-17T15:00:00.000Z",
    }),
    [],
  );
  assert.deepEqual(
    missingRequiredBookingFields({
      year: "",
      make: "Honda",
      model: "Civic",
      slot: "2026-09-17T15:00:00.000Z",
      symptoms: "anything",
    }),
    ["year"],
  );
});
