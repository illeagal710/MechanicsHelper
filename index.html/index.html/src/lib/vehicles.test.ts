import assert from "node:assert/strict";
import { test } from "node:test";
import { trimOptions } from "./trims.ts";
import { OTHER_VALUE, VEHICLE_DATA, resolveListedOrOther } from "./vehicles.ts";

test("Mercedes C320 and C230 Kompressor are selectable as models", () => {
  const models = VEHICLE_DATA["Mercedes-Benz"];
  assert.ok(models.includes("C320"), "C320 missing from Mercedes models");
  assert.ok(models.includes("C230 Kompressor"), "C230 Kompressor missing from Mercedes models");
  assert.ok(models.includes("C230"), "C230 missing from Mercedes models");
  assert.equal(models.at(-1), OTHER_VALUE);
});

test("C-Class trims group C320, C230 Kompressor, and related US C-Class badges", () => {
  const trims = trimOptions("Mercedes-Benz", "C-Class");
  for (const badge of ["C230", "C230 Kompressor", "C240", "C250", "C280", "C300", "C320", "C350", "C63 AMG"]) {
    assert.ok(trims.includes(badge), `${badge} missing from C-Class trims`);
  }
});

test("C320 and C230 Kompressor as models still offer a trim list", () => {
  assert.ok(trimOptions("Mercedes-Benz", "C320").includes("3.2 V6"));
  assert.ok(trimOptions("Mercedes-Benz", "C230 Kompressor").includes("Kompressor"));
});

test("everyday US coverage gained common shop cars", () => {
  assert.ok(VEHICLE_DATA.Nissan.includes("Ariya"));
  assert.ok(VEHICLE_DATA.Chevrolet.includes("C/K 1500"));
  assert.ok(VEHICLE_DATA.Honda.includes("CRX"));
  assert.ok(VEHICLE_DATA.Toyota.includes("T100"));
  assert.ok(VEHICLE_DATA.BMW.includes("328i"));
  assert.ok(trimOptions("BMW", "3 Series").includes("328i"));
  assert.ok(trimOptions("BMW", "3 Series").includes("325i"));
});

test("Other make/model/trim free-text keeps the stored year/make/model/trim shape", () => {
  assert.ok(Object.prototype.hasOwnProperty.call(VEHICLE_DATA, OTHER_VALUE));
  assert.deepEqual(VEHICLE_DATA[OTHER_VALUE], [OTHER_VALUE]);
  assert.equal(resolveListedOrOther("Mercedes-Benz", "ignored"), "Mercedes-Benz");
  assert.equal(resolveListedOrOther("Other", "Saab"), "Saab");
  assert.equal(resolveListedOrOther("Other", "  "), OTHER_VALUE);
  assert.equal(resolveListedOrOther("Other", "CRX"), "CRX");
  assert.ok(trimOptions("Honda", "Civic").includes(OTHER_VALUE));
  assert.ok(trimOptions("Other", "Other").includes(OTHER_VALUE));
});
