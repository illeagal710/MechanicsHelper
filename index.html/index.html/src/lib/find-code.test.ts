import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEMO_SHOP_FIND_CODE,
  FIND_CODE_INVALID,
  FIND_CODE_TAKEN,
  FIND_EQUALS_JOIN,
  RESERVED_FIND_CODES,
  allocateShopCodes,
  claimFindCode,
  findDiffersFromJoin,
  generateFindCode,
  generateUnusedCode,
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

test("RIV4 stays reserved; LEON is claimable when unused", () => {
  assert.ok(RESERVED_FIND_CODES.has(DEMO_SHOP_FIND_CODE));
  assert.equal(RESERVED_FIND_CODES.has("LEON"), false);
  const unused = new Set<string>();
  assert.deepEqual(claimFindCode("riv4", unused), { ok: false, error: FIND_CODE_TAKEN });
  assert.deepEqual(claimFindCode("riv4", unused, "RIV4"), { ok: true, code: "RIV4" });
  assert.deepEqual(claimFindCode("leon", unused), { ok: true, code: "LEON" });
  assert.deepEqual(claimFindCode("LEON", unused), { ok: true, code: "LEON" });
});

test("claimFindCode rejects a true duplicate, including LEON when another shop has it", () => {
  const used = new Set(["RIV4", "LEON"]);
  assert.deepEqual(claimFindCode("riv4", used), { ok: false, error: FIND_CODE_TAKEN });
  assert.deepEqual(claimFindCode("leon", used), { ok: false, error: FIND_CODE_TAKEN });
  assert.deepEqual(claimFindCode("MIKE", used), { ok: true, code: "MIKE" });
  assert.deepEqual(claimFindCode("leon", used, "LEON"), { ok: true, code: "LEON" });
});

test("claimFindCode rejects the shop's own team join code", () => {
  const used = new Set(["RIV4", "RIVTEAM"]);
  assert.deepEqual(claimFindCode("rivteam", used, "RIV4", "RIVTEAM"), { ok: false, error: FIND_EQUALS_JOIN });
  assert.deepEqual(claimFindCode("GARAGE1", used, "RIV4", "RIVTEAM"), { ok: true, code: "GARAGE1" });
});

test("find and team-join codes must be two different values", () => {
  assert.equal(findDiffersFromJoin("RIV4", "RIVTEAM"), true);
  assert.equal(findDiffersFromJoin("RIV4", "riv4"), false);
  assert.equal(findDiffersFromJoin("LEON", "LEON"), false);
  assert.equal(findDiffersFromJoin("", "RIVTEAM"), false);
});

test("allocateShopCodes never returns the same find and team-join code", () => {
  const used = new Set(["RIV4"]);
  const auto = allocateShopCodes(undefined, used);
  assert.equal(auto.ok, true);
  if (auto.ok) {
    assert.equal(findDiffersFromJoin(auto.findCode, auto.joinCode), true);
    assert.equal(used.has(auto.findCode), false);
    assert.equal(used.has(auto.joinCode), false);
    assert.notEqual(auto.findCode, "RIV4");
    assert.notEqual(auto.joinCode, "RIV4");
  }
  const custom = allocateShopCodes("GARAGE1", used);
  assert.equal(custom.ok, true);
  if (custom.ok) {
    assert.equal(custom.findCode, "GARAGE1");
    assert.equal(findDiffersFromJoin(custom.findCode, custom.joinCode), true);
  }
  const leon = allocateShopCodes("LEON", used);
  assert.equal(leon.ok, true);
  if (leon.ok) assert.equal(leon.findCode, "LEON");
  assert.deepEqual(allocateShopCodes("RIV4", used), { ok: false, error: FIND_CODE_TAKEN });
  assert.deepEqual(allocateShopCodes("LEON", new Set(["LEON"])), { ok: false, error: FIND_CODE_TAKEN });
});

test("generateFindCode is 4 unambiguous characters", () => {
  const code = generateFindCode();
  assert.equal(code.length, 4);
  assert.match(code, /^[A-HJ-NP-Z2-9]{4}$/);
});

test("generateUnusedCode skips reserved find and join values", () => {
  const used = new Set(["GARAGE1"]);
  const next = generateUnusedCode(used, "RIVTEAM");
  assert.equal(used.has(next), false);
  assert.notEqual(next, "RIVTEAM");
  assert.notEqual(next, DEMO_SHOP_FIND_CODE);
});
