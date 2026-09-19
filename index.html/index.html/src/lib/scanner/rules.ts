import { crossedUp, ema, lastClosedIndex, rsi, sma } from "./indicators.ts";
import type { BuyRules, Candle, ConditionResult, SetupEval } from "./types.ts";

function fmt(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function rulesFingerprint(rules: BuyRules): string {
  return JSON.stringify(rules);
}

export function evaluateSetup(
  candles: Candle[],
  rules: BuyRules,
  changePct: number | null,
): SetupEval | null {
  if (candles.length < 5) return null;
  const i = lastClosedIndex(candles.length);
  const candle = candles[i];
  if (!candle) return null;

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const conditions: ConditionResult[] = [];

  if (rules.rsi.enabled) {
    const series = rsi(closes, rules.rsi.period);
    const value = series[i];
    const passed = value != null && value < rules.rsi.max;
    conditions.push({
      id: "rsi",
      enabled: true,
      passed,
      label: `RSI(${rules.rsi.period}) < ${rules.rsi.max}`,
      detail: value == null ? "warming up" : fmt(value),
    });
  }

  if (rules.emaCross.enabled) {
    const fast = ema(closes, rules.emaCross.fast);
    const slow = ema(closes, rules.emaCross.slow);
    const passed = crossedUp(fast, slow, i);
    const f = fast[i];
    const s = slow[i];
    conditions.push({
      id: "emaCross",
      enabled: true,
      passed,
      label: `EMA ${rules.emaCross.fast} × ${rules.emaCross.slow}`,
      detail: f == null || s == null ? "warming up" : `${fmt(f, 2)} / ${fmt(s, 2)}`,
    });
  }

  if (rules.volumeSpike.enabled) {
    const avg = sma(volumes, rules.volumeSpike.period)[i];
    const passed =
      avg != null && avg > 0 && candle.volume >= avg * rules.volumeSpike.multiplier;
    conditions.push({
      id: "volumeSpike",
      enabled: true,
      passed,
      label: `Vol ≥ ${rules.volumeSpike.multiplier}× SMA${rules.volumeSpike.period}`,
      detail: avg == null || avg <= 0 ? "warming up" : `${fmt(candle.volume / avg, 2)}×`,
    });
  }

  if (rules.vsSma.enabled) {
    const ma = sma(closes, rules.vsSma.period)[i];
    const passed =
      ma != null &&
      (rules.vsSma.side === "above" ? candle.close > ma : candle.close < ma);
    conditions.push({
      id: "vsSma",
      enabled: true,
      passed,
      label: `Close ${rules.vsSma.side} SMA ${rules.vsSma.period}`,
      detail: ma == null ? "warming up" : fmt(candle.close / ma, 3),
    });
  }

  if (rules.pullback.enabled) {
    const passed = changePct != null && changePct <= rules.pullback.maxChangePct;
    conditions.push({
      id: "pullback",
      enabled: true,
      passed,
      label: `24h ≤ ${rules.pullback.maxChangePct}%`,
      detail: changePct == null ? "—" : `${fmt(changePct, 2)}%`,
    });
  }

  const enabled = conditions.filter((c) => c.enabled);
  const matched = enabled.length > 0 && enabled.every((c) => c.passed);
  const reasons = enabled.filter((c) => c.passed).map((c) => `${c.label} (${c.detail})`);
  const fingerprint = `${candle.openTime}|${rulesFingerprint(rules)}`;

  return {
    matched,
    price: candle.close,
    candleOpenTime: candle.openTime,
    conditions,
    reasons,
    fingerprint,
  };
}
