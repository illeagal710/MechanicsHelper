import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_INTERVAL, DEFAULT_RULES, SETUP_NAME } from "./defaults.ts";
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

function offExtras(patch: Partial<BuyRules> = {}): BuyRules {
  return {
    nearMa: { enabled: false, period: 21, maxPct: 2.5 },
    vsSma: { enabled: false, period: 200, side: "above" },
    stochRsi: {
      enabled: false,
      rsiPeriod: 14,
      stochPeriod: 14,
      kSmooth: 3,
      dSmooth: 3,
      max: 30,
    },
    rsi: { enabled: false, period: 14, max: 35 },
    emaCross: { enabled: false, fast: 9, slow: 21 },
    volumeSpike: { enabled: false, period: 20, multiplier: 1.6 },
    pullback: { enabled: false, maxChangePct: -3 },
    ...patch,
  };
}

const rsiOnly = offExtras({ rsi: { enabled: true, period: 3, max: 30 } });

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
  const both = offExtras({
    rsi: { enabled: true, period: 3, max: 30 },
    volumeSpike: { enabled: true, period: 3, multiplier: 2 },
  });
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
  const hit = evaluateSetup(series([1, 2, 3, 4, 5, 6, 7, 8]), offExtras(), -8);
  assert.ok(hit);
  assert.equal(hit.matched, false);
});

test("pullback uses the 24h change, not candle math", () => {
  const rules = offExtras({ pullback: { enabled: true, maxChangePct: -3 } });
  const candles = series([1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(evaluateSetup(candles, rules, -4)?.matched, true);
  assert.equal(evaluateSetup(candles, rules, -1)?.matched, false);
});

test("near-SMA 21 fires when close is on the average", () => {
  const closes = Array.from({ length: 30 }, () => 100);
  closes[28] = 101;
  const hit = evaluateSetup(
    series(closes),
    offExtras({ nearMa: { enabled: true, period: 21, maxPct: 2.5 } }),
    0,
  );
  assert.ok(hit);
  assert.equal(hit.matched, true);
});

test("near-SMA 21 misses when price is gapped away", () => {
  const closes = Array.from({ length: 30 }, () => 100);
  closes[28] = 120;
  const hit = evaluateSetup(
    series(closes),
    offExtras({ nearMa: { enabled: true, period: 21, maxPct: 2.5 } }),
    0,
  );
  assert.ok(hit);
  assert.equal(hit.matched, false);
});

test("Crypto Lifers defaults enable 21-touch, 200-trend, and StochRSI on 4h", () => {
  assert.equal(SETUP_NAME, "Crypto Lifers / Sam Price");
  assert.equal(DEFAULT_INTERVAL, "4h");
  assert.equal(DEFAULT_RULES.nearMa.enabled, true);
  assert.equal(DEFAULT_RULES.nearMa.period, 21);
  assert.equal(DEFAULT_RULES.nearMa.maxPct, 2.5);
  assert.equal(DEFAULT_RULES.vsSma.enabled, true);
  assert.equal(DEFAULT_RULES.vsSma.period, 200);
  assert.equal(DEFAULT_RULES.vsSma.side, "above");
  assert.equal(DEFAULT_RULES.stochRsi.enabled, true);
  assert.equal(DEFAULT_RULES.stochRsi.rsiPeriod, 14);
  assert.equal(DEFAULT_RULES.stochRsi.stochPeriod, 14);
  assert.equal(DEFAULT_RULES.stochRsi.kSmooth, 3);
  assert.equal(DEFAULT_RULES.stochRsi.dSmooth, 3);
  assert.equal(DEFAULT_RULES.stochRsi.max, 30);
  assert.equal(DEFAULT_RULES.rsi.enabled, false);
  assert.equal(DEFAULT_RULES.volumeSpike.enabled, false);
});

test("SMA 200 uptrend passes only when close is above the average", () => {
  const closes = Array.from({ length: 220 }, () => 100);
  closes[218] = 110;
  const above = offExtras({ vsSma: { enabled: true, period: 200, side: "above" } });
  assert.equal(evaluateSetup(series(closes), above, 0)?.matched, true);
  closes[218] = 90;
  assert.equal(evaluateSetup(series(closes), above, 0)?.matched, false);
});

test("Lifers AND misses when price is on the 21 but below the 200", () => {
  const closes = Array.from({ length: 220 }, () => 100);
  for (let i = 0; i < 180; i++) closes[i] = 130;
  closes[218] = 100.2;
  const rules = offExtras({
    nearMa: { enabled: true, period: 21, maxPct: 2.5 },
    vsSma: { enabled: true, period: 200, side: "above" },
  });
  const hit = evaluateSetup(series(closes), rules, 0);
  assert.ok(hit);
  assert.equal(hit.conditions.find((c) => c.id === "nearMa")?.passed, true);
  assert.equal(hit.conditions.find((c) => c.id === "vsSma")?.passed, false);
  assert.equal(hit.matched, false);
});

test("StochRSI reset matches a dump and misses a rally", () => {
  const dump = [
    ...Array.from({ length: 18 }, (_, i) => 40 + i * 2),
    ...Array.from({ length: 28 }, (_, i) => 76 - i * 3),
  ];
  const rally = [
    ...Array.from({ length: 18 }, (_, i) => 80 - i * 2),
    ...Array.from({ length: 28 }, (_, i) => 44 + i * 3),
  ];
  const rules = offExtras({
    stochRsi: {
      enabled: true,
      rsiPeriod: 5,
      stochPeriod: 5,
      kSmooth: 3,
      dSmooth: 3,
      max: 30,
    },
  });
  assert.equal(evaluateSetup(series(dump), rules, 0)?.matched, true);
  assert.equal(evaluateSetup(series(rally), rules, 0)?.matched, false);
});
