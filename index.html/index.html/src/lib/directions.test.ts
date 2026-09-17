import assert from "node:assert/strict";
import { test } from "node:test";
import { mapsDirectionsUrl, preferAppleMaps } from "./directions.ts";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";

test("preferAppleMaps detects Apple devices, not Android", () => {
  assert.equal(preferAppleMaps(IPHONE), true);
  assert.equal(preferAppleMaps(MAC), true);
  assert.equal(preferAppleMaps(ANDROID), false);
  assert.equal(preferAppleMaps(""), false);
  assert.equal(preferAppleMaps(undefined), false);
});

test("Android/other devices get a Google Maps directions link", () => {
  const url = mapsDirectionsUrl("123 Main St, Riverside, CA", { userAgent: ANDROID });
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(url, /123%20Main%20St%2C%20Riverside%2C%20CA/);
});

test("Apple devices get an Apple Maps directions link", () => {
  const url = mapsDirectionsUrl("123 Main St, Riverside, CA", { userAgent: IPHONE });
  assert.match(url, /^https:\/\/maps\.apple\.com\/\?daddr=/);
  assert.match(url, /123%20Main%20St/);
});

test("the apple option overrides UA detection", () => {
  assert.match(mapsDirectionsUrl("1 A St", { apple: true, userAgent: ANDROID }), /maps\.apple\.com/);
  assert.match(mapsDirectionsUrl("1 A St", { apple: false, userAgent: IPHONE }), /google\.com/);
});

test("a blank address yields no URL", () => {
  assert.equal(mapsDirectionsUrl("", { userAgent: IPHONE }), "");
  assert.equal(mapsDirectionsUrl("   ", { userAgent: ANDROID }), "");
});
