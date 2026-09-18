import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, isScryptHash, legacyPassHash, verifyPassword } from "./password.ts";

test("hashPassword produces a salted scrypt hash that verifies", () => {
  const stored = hashPassword("s3cret-pw");
  assert.ok(isScryptHash(stored));
  assert.match(stored, /^scrypt\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
  const ok = verifyPassword("s3cret-pw", stored);
  assert.equal(ok.ok, true);
  assert.equal(ok.needsRehash, false);
});

test("a wrong password does not verify", () => {
  const stored = hashPassword("correct horse");
  assert.equal(verifyPassword("battery staple", stored).ok, false);
});

test("the same password hashes differently each time (random salt)", () => {
  assert.notEqual(hashPassword("same"), hashPassword("same"));
});

test("legacy FNV hashes still verify but ask for a rehash", () => {
  const legacy = legacyPassHash("demo123");
  const verdict = verifyPassword("demo123", legacy);
  assert.equal(verdict.ok, true);
  assert.equal(verdict.needsRehash, true);
  assert.equal(verifyPassword("wrong", legacy).ok, false);
});

test("a tampered or malformed hash fails closed", () => {
  assert.equal(verifyPassword("x", "scrypt$16384$deadbeef").ok, false); // too few parts
  assert.equal(verifyPassword("x", "scrypt$16384$$").ok, false); // empty salt/hash
  assert.equal(verifyPassword("x", "").ok, false);
});
