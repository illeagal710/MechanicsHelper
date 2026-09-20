import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADDRESS_MAX,
  CREDENTIAL_IDS,
  SERVICE_AREA_MAX,
  SPECIALTY_IDS,
  TAGS_MAX,
  formatPublicPlace,
  publicProfileFromRecord,
  sanitizeAddress,
  sanitizePublicProfile,
  sanitizeServiceArea,
  sanitizeTags,
  sanitizeYearsWrenching,
  toggleTag,
} from "./shop-profile.ts";

test("public places uppercase two-letter state abbreviations", () => {
  assert.equal(formatPublicPlace("Riverside, Ca"), "Riverside, CA");
  assert.equal(formatPublicPlace("1450 Market St, Riverside, ca 92501"), "1450 Market St, Riverside, CA 92501");
  assert.equal(formatPublicPlace("Riverside, CA"), "Riverside, CA");
  assert.equal(formatPublicPlace("Inland Empire · mobile"), "Inland Empire · mobile");
});

test("address collapses whitespace, strips angle brackets, and caps length", () => {
  assert.equal(sanitizeAddress("  123 Main St,\n  Riverside, Ca  "), "123 Main St, Riverside, CA");
  assert.equal(sanitizeAddress("<b>10 Oak Ave</b>"), "b10 Oak Ave/b");
  assert.equal(sanitizeAddress(""), "");
  assert.equal(sanitizeAddress(undefined), "");
  assert.ok(sanitizeAddress("x".repeat(ADDRESS_MAX + 50)).length <= ADDRESS_MAX);
});

test("public profile carries an address through sanitize and record reads", () => {
  assert.equal(sanitizePublicProfile({ address: " 5 Bay Rd " }).address, "5 Bay Rd");
  assert.equal(publicProfileFromRecord({ address: " 5 Bay Rd " }).address, "5 Bay Rd");
  assert.equal(publicProfileFromRecord(null).address, "");
});

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
    address: "1450 Market St, Riverside, CA 92501",
  });
  assert.deepEqual(profile, {
    specialties: ["brakes", "mobile"],
    credentials: ["ase", "insured"],
    serviceArea: "Riverside, CA",
    yearsWrenching: "25",
    address: "1450 Market St, Riverside, CA 92501",
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
