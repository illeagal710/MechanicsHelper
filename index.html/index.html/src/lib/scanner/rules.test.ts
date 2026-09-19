import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_RULES } from "./defaults.ts";
import { evaluateSetup } from "./rules.ts";
import type { BuyRules, Candle } from "./types.ts";

function candle(close: number, volume = 100, i = 0): Candle {
  return {
    openTime: i * 60_000,
    open: close,
    high: close,
    low: close,
    close,
    volume,
    closeTime: i * 60_000 + 59_000,
  };
}

function series(closes: number[], volumes?: number[]): Candle[] {
  return closes.map((c, i) => candle(c, volumes?.[i] ?? 100, i));
}

const rsiOnly: BuyRules = {
  ...DEFAULT_RULES,
  rsi: { enabled: true, period: 3, max: 30 },
  emaCross: { enabled: false, fast: 9, slow: 21 },
  volumeSpike: { enabled: false, period: 20, multiplier: 1.6 },
  vsSma: { enabled: false, period: 50, side: "above" },
  pullback: { enabled: false, maxChangePct: -3 },
};

test("oversold RSI on a dump matches when that is the only enabled rule", () => {
  const dump = series([10, 9, 8, 7, 6, 5, 4, 3]);
  const hit = evaluateSetup(dump, rsiOnly, 0);
  assert.ok(hit);
  assert.equal(hit.matched, true);
  assert.equal(hit.conditions[0]?.id, "rsi");
  assert.equal(hit.conditions[0]?.passed, true);
});

test("rally does not match an oversold RSI rule", () => {
  const rally = series([3, 4, 5, 6, 7, 8, 9, 10]);
  const hit = evaluateSetup(rally, rsiOnly, 0);
  assert.ok(hit);
  assert.equal(hit.matched, false);
});

test("AND rules require every enabled condition", () => {
  const volumes = [10, 10, 10, 10, 10, 10, 80, 10];
  const dump = series([10, 9, 8, 7, 6, 5, 4, 3], volumes);
  const both: BuyRules = {
    ...rsiOnly,
    volumeSpike: { enabled: true, period: 3, multiplier: 2 },
  };
  const hit = evaluateSetup(dump, both, 0);
  assert.ok(hit);
  assert.equal(hit.matched, true);

  const quiet = series([10, 9, 8, 7, 6, 5, 4, 3], [10, 10, 10, 10, 10, 10, 10, 11]);
  const miss = evaluateSetup(quiet, both, 0);
  assert.ok(miss);
  assert.equal(miss.matched, false);
  assert.equal(miss.conditions.find((c) => c.id === "volumeSpike")?.passed, false);
});

test("no enabled conditions cannot match", () => {
  const none: BuyRules = {
    rsi: { enabled: false, period: 14, max: 30 },
    emaCross: { enabled: false, fast: 9, slow: 21 },
    volumeSpike: { enabled: false, period: 20, multiplier: 1.6 },
    vsSma: { enabled: false, period: 50, side: "above" },
    pullback: { enabled: false, maxChangePct: -3 },
  };
  const hit = evaluateSetup(series([1, 2, 3, 4, 5, 6, 7, 8]), none, -8);
  assert.ok(hit);
  assert.equal(hit.matched, false);
});

test("pullback uses the 24h change, not candle math", () => {
  const rules: BuyRules = {
    ...rsiOnly,
    rsi: { enabled: false, period: 14, max: 30 },
    pullback: { enabled: true, maxChangePct: -3 },
  };
  const candles = series([1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(evaluateSetup(candles, rules, -4)?.matched, true);
  assert.equal(evaluateSetup(candles, rules, -1)?.matched, false);
});
