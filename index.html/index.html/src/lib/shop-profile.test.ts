import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CREDENTIAL_IDS,
  SERVICE_AREA_MAX,
  SPECIALTY_IDS,
  TAGS_MAX,
  publicProfileFromRecord,
  sanitizePublicProfile,
  sanitizeServiceArea,
  sanitizeTags,
  sanitizeYearsWrenching,
  toggleTag,
} from "./shop-profile.ts";

test("preset specialty chips stay as ids and custom Other is kept", () => {
  assert.deepEqual(sanitizeTags(["Brakes", "diagnostics", "Euro vans"], SPECIALTY_IDS), [
    "brakes",
    "diagnostics",
    "Euro vans",
  ]);
});

test("credential chips accept ASE / license / insurance and drop junk", () => {
  assert.deepEqual(sanitizeTags(["ASE", "mobile_license", "<script>", "insured"], CREDENTIAL_IDS), [
    "ase",
    "mobile_license",
    "insured",
  ]);
});

test("tag lists cap, dedupe, and ignore empties", () => {
  const many = Array.from({ length: 20 }, (_, i) => `Tag ${i}`);
  const cleaned = sanitizeTags(["  ", "Oil", "oil", ...many], SPECIALTY_IDS);
  assert.equal(cleaned[0], "oil");
  assert.ok(cleaned.length <= TAGS_MAX);
  assert.equal(new Set(cleaned.map((t) => t.toLowerCase())).size, cleaned.length);
});

test("service area is a short Based-in line, not a map", () => {
  assert.equal(sanitizeServiceArea("  Inland Empire \n driveway  "), "Inland Empire driveway");
  assert.equal(sanitizeServiceArea("x".repeat(SERVICE_AREA_MAX + 20)).length, SERVICE_AREA_MAX);
});

test("years wrenching is a small number or empty", () => {
  assert.equal(sanitizeYearsWrenching("14 years"), "14");
  assert.equal(sanitizeYearsWrenching("0"), "");
  assert.equal(sanitizeYearsWrenching("99"), "60");
  assert.equal(sanitizeYearsWrenching(""), "");
});

test("row JSON from shops/users maps onto the public card fields", () => {
  const profile = publicProfileFromRecord({
    specialties_json: '["brakes","mobile"]',
    credentials_json: '["ase","insured"]',
    service_area: "Riverside, CA",
    years_wrenching: "25",
  });
  assert.deepEqual(profile, {
    specialties: ["brakes", "mobile"],
    credentials: ["ase", "insured"],
    serviceArea: "Riverside, CA",
    yearsWrenching: "25",
  });
});

test("sanitizePublicProfile is the same shape shops and independents persist", () => {
  const saved = sanitizePublicProfile({
    specialties: ["tires", "Other bay"],
    credentials: ["mobile license"],
    serviceArea: "Ontario, CA",
    yearsWrenching: "8",
  });
  assert.deepEqual(saved.specialties, ["tires", "Other bay"]);
  assert.deepEqual(saved.credentials, ["mobile_license"]);
  assert.equal(saved.serviceArea, "Ontario, CA");
  assert.equal(saved.yearsWrenching, "8");
});

test("toggleTag adds and removes a chip without inventing extras", () => {
  const on = toggleTag(["brakes"], "oil", SPECIALTY_IDS);
  assert.deepEqual(on, ["brakes", "oil"]);
  assert.deepEqual(toggleTag(on, "brakes", SPECIALTY_IDS), ["oil"]);
});
