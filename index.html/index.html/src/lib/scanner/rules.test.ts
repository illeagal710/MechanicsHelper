import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_INTERVAL, DEFAULT_RULES, PRETRADE_CHECKS, SETUP_NAME, VRVP_SETTINGS } from "./defaults.ts";
import { evaluateSetup } from "./rules.ts";
import type { BuyRules, Candle } from "./types.ts";

function candle(close: number, volume = 100, i = 0, high = close, low = close): Candle {
  return {
    openTime: i * 60_000,
    open: close,
    high,
    low,
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
    nearMa: { enabled: false, period: 21 },
    vsSma: { enabled: false, fast: 21, period: 200, side: "above" },
    stretchMa: { enabled: false, period: 21, atrPeriod: 14, atrMult: 1.5 },
    deathCross: { enabled: false, fast: 50, slow: 200 },
    earlyDeath: { enabled: false, fast: 21, slow: 50 },
    stochRsi: {
      enabled: false,
      rsiPeriod: 14,
      stochPeriod: 14,
      kSmooth: 3,
      dSmooth: 3,
      dotted: 20,
    },
    jdStoch: { display: true, kLength: 40, kSmooth: 4, dSmooth: 1 },
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
  assert.equal(hit.conditions.find((c) => c.id === "rsi")?.passed, true);
});

test("rally does not match an oversold RSI rule", () => {
  const rally = series([3, 4, 5, 6, 7, 8, 9, 10]);
  const hit = evaluateSetup(rally, rsiOnly, 0);
  assert.ok(hit);
  assert.equal(hit.matched, false);
});

test("AND rules require every enabled buy condition", () => {
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

test("no enabled buy conditions cannot match", () => {
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

test("on SMA 21 fires when the wick includes the average — no percent band", () => {
  const closes = Array.from({ length: 30 }, () => 100);
  const hit = evaluateSetup(
    series(closes),
    offExtras({ nearMa: { enabled: true, period: 21 } }),
    0,
  );
  assert.ok(hit);
  assert.equal(hit.matched, true);
  assert.equal(hit.conditions.find((c) => c.id === "nearMa")?.detail, "flagging");
});

test("on SMA 21 misses a 2% gap that the old 2.5% band would have taken", () => {
  const closes = Array.from({ length: 30 }, () => 100);
  const bars = series(closes);
  bars[28] = candle(102, 100, 28, 102, 102);
  const hit = evaluateSetup(bars, offExtras({ nearMa: { enabled: true, period: 21 } }), 0);
  assert.ok(hit);
  assert.equal(hit.matched, false);
  assert.equal(hit.conditions.find((c) => c.id === "nearMa")?.passed, false);
});

test("Crypto Lifers defaults: 4h 21×200 cross, 50/200 death, 21×50 early, StochRSI not required", () => {
  assert.equal(SETUP_NAME, "Crypto Lifers / Sam Price");
  assert.equal(DEFAULT_INTERVAL, "4h");
  assert.equal(DEFAULT_RULES.nearMa.enabled, false);
  assert.equal(DEFAULT_RULES.nearMa.period, 21);
  assert.equal("maxPct" in DEFAULT_RULES.nearMa, false);
  assert.equal(DEFAULT_RULES.vsSma.enabled, true);
  assert.equal(DEFAULT_RULES.vsSma.fast, 21);
  assert.equal(DEFAULT_RULES.vsSma.period, 200);
  assert.equal(DEFAULT_RULES.vsSma.side, "above");
  assert.equal(DEFAULT_RULES.stretchMa.enabled, true);
  assert.equal(DEFAULT_RULES.deathCross.enabled, true);
  assert.equal(DEFAULT_RULES.deathCross.fast, 50);
  assert.equal(DEFAULT_RULES.deathCross.slow, 200);
  assert.equal(DEFAULT_RULES.earlyDeath.enabled, true);
  assert.equal(DEFAULT_RULES.earlyDeath.fast, 21);
  assert.equal(DEFAULT_RULES.earlyDeath.slow, 50);
  assert.equal(DEFAULT_RULES.stochRsi.enabled, false);
  assert.equal(DEFAULT_RULES.stochRsi.dotted, 20);
  assert.equal(DEFAULT_RULES.jdStoch.display, true);
  assert.equal(DEFAULT_RULES.jdStoch.kLength, 40);
  assert.equal(DEFAULT_RULES.jdStoch.kSmooth, 4);
  assert.equal(DEFAULT_RULES.jdStoch.dSmooth, 1);
  assert.equal(PRETRADE_CHECKS.length, 9);
  assert.equal(VRVP_SETTINGS.rowSize, 240);
  assert.equal(VRVP_SETTINGS.valueArea, 70);
});

test("SMA 21 above 200 continuation needs price on the 21, not a stretch-away", () => {
  const closes = Array.from({ length: 220 }, (_, i) => (i < 160 ? 80 : 120));
  const above = offExtras({ vsSma: { enabled: true, fast: 21, period: 200, side: "above" } });
  assert.equal(evaluateSetup(series(closes), above, 0)?.matched, true);
  const bars = series(closes);
  bars[218] = candle(140, 100, 218, 141, 139);
  const stretched = evaluateSetup(bars, above, 0);
  assert.equal(stretched?.matched, false);
  assert.equal(stretched?.conditions.find((c) => c.id === "vsSma")?.detail, "above, off 21");
  const dumped = Array.from({ length: 220 }, (_, i) => (i < 160 ? 120 : 80));
  assert.equal(evaluateSetup(series(dumped), above, 0)?.matched, false);
});

test("Lifers AND misses when price is on the 21 but 21 is not above the 200", () => {
  const closes = Array.from({ length: 220 }, (_, i) => (i < 180 ? 130 : 100));
  const rules = offExtras({
    nearMa: { enabled: true, period: 21 },
    vsSma: { enabled: true, fast: 21, period: 200, side: "above" },
  });
  const hit = evaluateSetup(series(closes), rules, 0);
  assert.ok(hit);
  assert.equal(hit.conditions.find((c) => c.id === "nearMa")?.passed, true);
  assert.equal(hit.conditions.find((c) => c.id === "vsSma")?.passed, false);
  assert.equal(hit.matched, false);
});

test("StochRSI dotted-line low matches a dump and misses a rally; not required by default", () => {
  const dump = [
    ...Array.from({ length: 18 }, (_, i) => 40 + i * 2),
    ...Array.from({ length: 28 }, (_, i) => 76 - i * 3),
  ];
  const rally = [
    ...Array.from({ length: 18 }, (_, i) => 80 - i * 2),
    ...Array.from({ length: 28 }, (_, i) => 44 + i * 3),
  ];
  const required = offExtras({
    stochRsi: {
      enabled: true,
      rsiPeriod: 5,
      stochPeriod: 5,
      kSmooth: 3,
      dSmooth: 3,
      dotted: 20,
    },
  });
  assert.equal(evaluateSetup(series(dump), required, 0)?.matched, true);
  assert.equal(evaluateSetup(series(rally), required, 0)?.matched, false);
  const displayOnly = offExtras({
    stochRsi: {
      enabled: false,
      rsiPeriod: 5,
      stochPeriod: 5,
      kSmooth: 3,
      dSmooth: 3,
      dotted: 20,
    },
  });
  const shown = evaluateSetup(series(dump), displayOnly, 0);
  assert.equal(shown?.matched, false);
  assert.equal(shown?.conditions.find((c) => c.id === "stochRsi")?.role, "confluence");
});

test("stretch warning fires when price leaves the 21, without matching a long", () => {
  const bars: Candle[] = [];
  for (let i = 0; i < 40; i++) {
    const close = 100 + (i % 3) - 1;
    bars.push(candle(close, 100, i, close + 1.2, close - 1.2));
  }
  bars[38] = candle(112, 100, 38, 113, 111);
  const hit = evaluateSetup(
    bars,
    offExtras({ stretchMa: { enabled: true, period: 21, atrPeriod: 5, atrMult: 1.5 } }),
    0,
  );
  assert.ok(hit);
  assert.equal(hit.matched, false);
  assert.equal(hit.warning, true);
  assert.equal(hit.conditions.find((c) => c.id === "stretchMa")?.passed, true);
  assert.equal(hit.conditions.find((c) => c.id === "stretchMa")?.role, "warning");
});

test("death cross warns on the 50×200 print bar, not a rising stack", () => {
  const fast = 3;
  const slow = 5;
  const rising = [10, 11, 12, 13, 14, 15, 16];
  const miss = evaluateSetup(
    series(rising),
    offExtras({ deathCross: { enabled: true, fast, slow } }),
    0,
  );
  assert.equal(miss?.conditions.find((c) => c.id === "deathCross")?.passed, false);

  const dump = [20, 21, 22, 23, 22, 18, 14];
  const print = evaluateSetup(
    series(dump),
    offExtras({ deathCross: { enabled: true, fast, slow } }),
    0,
  );
  assert.ok(print);
  assert.equal(print.matched, false);
  assert.equal(print.warning, true);
  assert.equal(print.conditions.find((c) => c.id === "deathCross")?.passed, true);
});

test("early warning fires when 21 crosses 50, without a long match", () => {
  const dump = [20, 21, 22, 23, 22, 18, 14];
  const hit = evaluateSetup(
    series(dump),
    offExtras({ earlyDeath: { enabled: true, fast: 3, slow: 5 } }),
    0,
  );
  assert.ok(hit);
  assert.equal(hit.matched, false);
  assert.equal(hit.warning, true);
  assert.equal(hit.conditions.find((c) => c.id === "earlyDeath")?.passed, true);
});
