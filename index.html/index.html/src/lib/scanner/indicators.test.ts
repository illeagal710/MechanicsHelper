import assert from "node:assert/strict";
import { test } from "node:test";
import { crossedUp, lastClosedIndex, rsi, sma, stochRsi } from "./indicators.ts";
import { LIFER_MA_COLORS, LIFER_MAS } from "./defaults.ts";

test("SMA is the simple window mean", () => {
  const series = sma([1, 2, 3, 4, 5], 3);
  assert.equal(series[0], null);
  assert.equal(series[1], null);
  assert.equal(series[2], 2);
  assert.equal(series[3], 3);
  assert.equal(series[4], 4);
});

test("RSI is 100 on a straight-up run and 0 on a straight-down run", () => {
  const up = rsi([1, 2, 3, 4, 5, 6], 3);
  const down = rsi([6, 5, 4, 3, 2, 1], 3);
  assert.equal(up[3], 100);
  assert.equal(down[3], 0);
});

test("StochRSI is high after a rally and low after a dump", () => {
  // Monotonic series keeps RSI pinned (StochRSI = 50). Reverse first so RSI actually moves.
  const up = [...Array.from({ length: 18 }, (_, i) => 80 - i * 2), ...Array.from({ length: 28 }, (_, i) => 44 + i * 3)];
  const down = [...Array.from({ length: 18 }, (_, i) => 40 + i * 2), ...Array.from({ length: 28 }, (_, i) => 76 - i * 3)];
  const upK = stochRsi(up, 5, 5, 3, 3).k;
  const downK = stochRsi(down, 5, 5, 3, 3).k;
  const lastUp = [...upK].reverse().find((v) => v != null);
  const lastDown = [...downK].reverse().find((v) => v != null);
  assert.ok(lastUp != null && lastUp > 70, `rally StochRSI ${lastUp}`);
  assert.ok(lastDown != null && lastDown < 30, `dump StochRSI ${lastDown}`);
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

test("LIFER_5ma periods are 21 50 80 100 200 with TV colors", () => {
  assert.deepEqual([...LIFER_MAS], [21, 50, 80, 100, 200]);
  assert.equal(LIFER_MA_COLORS[21], "#ffffff");
  assert.equal(LIFER_MA_COLORS[50], "#ff0000");
  assert.equal(LIFER_MA_COLORS[80], "#800080");
  assert.equal(LIFER_MA_COLORS[100], "#0000ff");
  assert.equal(LIFER_MA_COLORS[200], "#ffff00");
});
