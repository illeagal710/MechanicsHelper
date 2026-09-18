process.env.AUTH_TOKEN_SECRET = "test-secret-for-session-tokens";

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { signSession, verifySession } from "./session-token.ts";

test("a signed token round-trips to its user id", () => {
  const token = signSession("u-maya");
  assert.equal(verifySession(token), "u-maya");
});

test("a tampered payload or signature is rejected", () => {
  const token = signSession("u-shop");
  const [payload, sig] = token.split(".");
  assert.equal(verifySession(`${payload}x.${sig}`), null);
  assert.equal(verifySession(`${payload}.${sig}x`), null);
  assert.equal(verifySession("garbage"), null);
  assert.equal(verifySession(""), null);
  assert.equal(verifySession(undefined), null);
});

test("a forged token for another user (wrong secret) is rejected", () => {
  // Build a token as an attacker would, signing with a different secret.
  const payload = Buffer.from(JSON.stringify({ sub: "u-victim", exp: Date.now() + 1000 })).toString(
    "base64url",
  );
  const badSig = createHmac("sha256", "not-the-secret").update(payload).digest("base64url");
  assert.equal(verifySession(`${payload}.${badSig}`), null);
});

test("an expired token is rejected", () => {
  const now = 1_000_000_000_000;
  const token = signSession("u-alex", now);
  assert.equal(verifySession(token, now + 1000), "u-alex");
  assert.equal(verifySession(token, now + 61 * 24 * 60 * 60 * 1000), null);
});
