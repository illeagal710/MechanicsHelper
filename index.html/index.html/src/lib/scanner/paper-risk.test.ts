import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PAPER_RISK_PCT,
  REWARD_RATIO,
  formatPaperPlan,
  paperStopHit,
  pickStopSma200,
  planPaperLong,
  lastSma200,
  stopOutPnl,
  stopUnderSma200,
} from "./paper-risk.ts";

test("risk is 1% of the paper account", () => {
  assert.equal(PAPER_RISK_PCT, 1);
  assert.equal(REWARD_RATIO, 3);
});

test("YouTube example A: $100 risk ÷ 1.17% stop ≈ $8,547 notional", () => {
  const entry = 100;
  const sma200 = entry * (1 - 0.0117) / (1 - 0.0005);
  const plan = planPaperLong({ equity: 10_000, entry, sma200 });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.dollarRisk, 100);
  assert.ok(Math.abs(plan.stopPct - 0.0117) < 1e-6);
  assert.ok(Math.abs(plan.quote - 100 / 0.0117) < 1);
  assert.ok(plan.stop < sma200);
  assert.ok(plan.stop < entry);
});

test("YouTube example B: 3.05% stop, 3:1 target, size = $100 ÷ 0.0305", () => {
  const entry = 100;
  const sma200 = entry * (1 - 0.0305) / (1 - 0.0005);
  const plan = planPaperLong({ equity: 10_000, entry, sma200 });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.ok(Math.abs(plan.stopPct - 0.0305) < 1e-6);
  assert.ok(Math.abs(plan.quote - 100 / 0.0305) < 1);
  const rewardPct = (plan.target - entry) / entry;
  assert.ok(Math.abs(rewardPct - 0.0305 * 3) < 1e-6);
  assert.match(formatPaperPlan(plan), /3:1/);
  assert.match(formatPaperPlan(plan), /size/);
});

test("stop uses last setup’s 200 when the live 200 is at or above entry", () => {
  const picked = pickStopSma200(101, 97, 100);
  assert.deepEqual(picked, { value: 97, source: "last-setup" });
  const plan = planPaperLong({ equity: 10_000, entry: 100, sma200: 101, lastSetupSma200: 97 });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.sma200Source, "last-setup");
  assert.equal(plan.sma200, 97);
  assert.ok(plan.stop < 97);
});

test("refuses a long when neither 200 is under entry", () => {
  const miss = planPaperLong({ equity: 10_000, entry: 100, sma200: 100, lastSetupSma200: 105 });
  assert.equal(miss.ok, false);
});

test("stop is strictly under the SMA 200", () => {
  assert.ok(stopUnderSma200(200) < 200);
});

test("paper stop-out fires on a later candle that trades through the stop", () => {
  assert.equal(paperStopHit(96, 97, 2, 1), true);
  assert.equal(paperStopHit(98, 97, 2, 1), false);
  assert.equal(paperStopHit(96, 97, 1, 1), false);
  const pnl = stopOutPnl({ entry: 100, quantity: 30, stop: 97 });
  assert.equal(pnl, -90);
});

test("lastSma200 reads the closed bar’s 200", () => {
  const closes = Array.from({ length: 220 }, () => 50);
  assert.equal(lastSma200(closes), 50);
  assert.equal(lastSma200(Array.from({ length: 50 }, () => 50)), null);
});
