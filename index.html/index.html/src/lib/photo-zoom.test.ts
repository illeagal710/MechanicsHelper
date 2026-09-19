import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPan, clampZoom } from "./photo-zoom.ts";

test("zoom stays between 1x and 4x", () => {
  assert.equal(clampZoom(0.2), 1);
  assert.equal(clampZoom(1), 1);
  assert.equal(clampZoom(2.5), 2.5);
  assert.equal(clampZoom(9), 4);
});

test("1x zoom cannot pan — that was the fixed-in-one-area bug", () => {
  assert.deepEqual(clampPan(80, -40, 1, 400, 300), { x: 0, y: 0 });
});

test("zoomed pan is clamped to the extra overflow so you can look around", () => {
  // scale 2 on 400×300 → ±200 x, ±150 y
  assert.deepEqual(clampPan(0, 0, 2, 400, 300), { x: 0, y: 0 });
  assert.deepEqual(clampPan(80, -40, 2, 400, 300), { x: 80, y: -40 });
  assert.deepEqual(clampPan(500, -400, 2, 400, 300), { x: 200, y: -150 });
  assert.deepEqual(clampPan(-500, 400, 2, 400, 300), { x: -200, y: 150 });
});
