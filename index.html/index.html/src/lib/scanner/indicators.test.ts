import assert from "node:assert/strict";
import { test } from "node:test";
import { crossedUp, ema, lastClosedIndex, rsi, sma } from "./indicators.ts";

test("SMA is the simple window mean", () => {
  const series = sma([1, 2, 3, 4, 5], 3);
  assert.equal(series[0], null);
  assert.equal(series[1], null);
  assert.equal(series[2], 2);
  assert.equal(series[3], 3);
  assert.equal(series[4], 4);
});

test("EMA seeds from SMA then smooths", () => {
  const series = ema([1, 2, 3, 4], 2);
  assert.equal(series[0], null);
  assert.equal(series[1], 1.5);
  assert.ok(series[2] != null && Math.abs(series[2] - (3 * (2 / 3) + 1.5 * (1 / 3))) < 1e-9);
});

test("RSI is 100 on a straight-up run and 0 on a straight-down run", () => {
  const up = rsi([1, 2, 3, 4, 5, 6], 3);
  const down = rsi([6, 5, 4, 3, 2, 1], 3);
  assert.equal(up[3], 100);
  assert.equal(down[3], 0);
});

test("crossedUp detects a fast EMA crossing above slow", () => {
  const fast = [null, 1, 2, 4];
  const slow = [null, 2, 2.5, 3];
  assert.equal(crossedUp(fast, slow, 2), false);
  assert.equal(crossedUp(fast, slow, 3), true);
});

test("lastClosedIndex skips the in-progress candle", () => {
  assert.equal(lastClosedIndex(10), 8);
  assert.equal(lastClosedIndex(1), 0);
  assert.equal(lastClosedIndex(0), 0);
});
