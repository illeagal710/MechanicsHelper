import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialViewFromSearch,
  loginRedirectHref,
  parseAppEntrySearch,
} from "./app-entry.ts";

test("bare /login redirect opens the in-app login view", () => {
  assert.equal(loginRedirectHref(""), "/?view=login");
  assert.equal(loginRedirectHref("?"), "/?view=login");
});

test("login redirect keeps a referral code", () => {
  const href = loginRedirectHref("?ref=RIV4");
  const q = new URLSearchParams(href.replace(/^\//, "").replace(/^\?/, ""));
  assert.equal(q.get("view"), "login");
  assert.equal(q.get("ref"), "RIV4");
});

test("parseAppEntrySearch only treats view=login as the sign-in screen", () => {
  assert.deepEqual(parseAppEntrySearch({ view: "login", ref: " LEON " }), {
    view: "login",
    ref: "LEON",
  });
  assert.deepEqual(parseAppEntrySearch({ view: "home" }), {});
  assert.deepEqual(parseAppEntrySearch({}), {});
});

test("initialViewFromSearch maps login search to the login screen", () => {
  assert.equal(initialViewFromSearch({ view: "login" }), "login");
  assert.equal(initialViewFromSearch({}), "welcome");
  assert.equal(initialViewFromSearch({ ref: "RIV4" }), "welcome");
});
