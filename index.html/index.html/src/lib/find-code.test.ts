import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FIND_CODE_INVALID,
  FIND_CODE_TAKEN,
  claimFindCode,
  generateFindCode,
  normalizeFindCode,
  parseFindCode,
} from "./find-code.ts";

test("normalizeFindCode uppercases and strips junk", () => {
  assert.equal(normalizeFindCode(" leo n "), "LEON");
  assert.equal(normalizeFindCode("riv-4"), "RIV4");
  assert.equal(normalizeFindCode("mike1"), "MIKE1");
});

test("parseFindCode accepts 4–8 letters or numbers", () => {
  assert.deepEqual(parseFindCode("LEON"), { ok: true, code: "LEON" });
  assert.deepEqual(parseFindCode("GARAGE1"), { ok: true, code: "GARAGE1" });
  assert.equal(parseFindCode("AB").ok, false);
  assert.equal(parseFindCode("TOOLONG99").ok, false);
  assert.equal(parseFindCode("   ").ok, false);
  const tooShort = parseFindCode("x");
  assert.equal(tooShort.ok, false);
  if (!tooShort.ok) assert.equal(tooShort.error, FIND_CODE_INVALID);
});

test("claimFindCode rejects a code someone else already has", () => {
  const used = new Set(["RIV4", "LEON"]);
  assert.deepEqual(claimFindCode("riv4", used), { ok: false, error: FIND_CODE_TAKEN });
  assert.deepEqual(claimFindCode("MIKE", used), { ok: true, code: "MIKE" });
  assert.deepEqual(claimFindCode("leon", used, "LEON"), { ok: true, code: "LEON" });
});

test("generateFindCode is 4 unambiguous characters", () => {
  const code = generateFindCode();
  assert.equal(code.length, 4);
  assert.match(code, /^[A-HJ-NP-Z2-9]{4}$/);
});
