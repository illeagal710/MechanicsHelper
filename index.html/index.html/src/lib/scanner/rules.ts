import { atr, crossedDown, crossedUp, ema, lastClosedIndex, rsi, sma, stochRsi } from "./indicators.ts";
import type { BuyRules, Candle, ConditionResult, SetupEval } from "./types.ts";

function fmt(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function rulesFingerprint(rules: BuyRules): string {
  return JSON.stringify(rules);
}

function touchesMa(candle: Candle | undefined, ma: number | null | undefined): boolean {
  if (!candle || ma == null) return false;
  return candle.low <= ma && candle.high >= ma;
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

  {
    const series = sma(closes, rules.nearMa.period);
    const ma = series[i];
    const on = touchesMa(candle, ma);
    let recent = 0;
    for (let k = 0; k < 3; k++) {
      if (i - k >= 0 && touchesMa(candles[i - k], series[i - k])) recent += 1;
    }
    const flagging = on && recent >= 2;
    const require = rules.nearMa.enabled;
    conditions.push({
      id: "nearMa",
      enabled: require,
      passed: on,
      role: require ? "buy" : "confluence",
      label: `On / flagging SMA ${rules.nearMa.period}`,
      detail: ma == null ? "warming up" : flagging ? "flagging" : on ? "on" : "off",
    });
  }

  if (rules.vsSma.enabled) {
    const fast = sma(closes, rules.vsSma.fast);
    const slow = sma(closes, rules.vsSma.period);
    const f = fast[i];
    const s = slow[i];
    const crossing =
      rules.vsSma.side === "above" ? crossedUp(fast, slow, i) : crossedDown(fast, slow, i);
    const stacked =
      f != null && s != null && (rules.vsSma.side === "above" ? f > s : f < s);
    const onFast = touchesMa(candle, f);
    // 4h lesson: long on the 21×200 cross; continuation = already stacked and on the 21.
    const passed = crossing || (stacked && onFast);
    conditions.push({
      id: "vsSma",
      enabled: true,
      passed,
      role: "buy",
      label:
        rules.vsSma.side === "above"
          ? `SMA ${rules.vsSma.fast} crosses above SMA ${rules.vsSma.period}`
          : `SMA ${rules.vsSma.fast} crosses below SMA ${rules.vsSma.period}`,
      detail:
        f == null || s == null
          ? "warming up"
          : crossing
            ? "4h cross"
            : stacked && onFast
              ? "above + on 21"
              : stacked
                ? "above, off 21"
                : "not stacked",
    });
  }

  if (rules.stretchMa.enabled) {
    const ma = sma(closes, rules.stretchMa.period)[i];
    const a = atr(candles, rules.stretchMa.atrPeriod)[i];
    const dist = ma != null ? Math.abs(candle.close - ma) : null;
    const touch = touchesMa(candle, ma);
    const atrs = dist != null && a != null && a > 0 ? dist / a : null;
    const passed = Boolean(!touch && atrs != null && atrs >= rules.stretchMa.atrMult);
    const side = ma != null && candle.close >= ma ? "above" : "below";
    conditions.push({
      id: "stretchMa",
      enabled: true,
      passed,
      role: "warning",
      label: `Stretch off SMA ${rules.stretchMa.period}`,
      detail: atrs == null ? "warming up" : `${fmt(atrs, 1)} ATR ${side}`,
    });
  }

  if (rules.deathCross.enabled) {
    const fast = sma(closes, rules.deathCross.fast);
    const slow = sma(closes, rules.deathCross.slow);
    const print = crossedDown(fast, slow, i);
    const below = fast[i] != null && slow[i] != null && fast[i]! < slow[i]!;
    conditions.push({
      id: "deathCross",
      enabled: true,
      passed: print,
      role: "warning",
      label: `Death cross (${rules.deathCross.fast} × ${rules.deathCross.slow})`,
      detail: print ? "4h print" : below ? "50 below 200" : "no print",
    });
  }

  if (rules.earlyDeath.enabled) {
    const fast = sma(closes, rules.earlyDeath.fast);
    const slow = sma(closes, rules.earlyDeath.slow);
    const passed = crossedDown(fast, slow, i);
    conditions.push({
      id: "earlyDeath",
      enabled: true,
      passed,
      role: "warning",
      label: `Early warning (${rules.earlyDeath.fast} × ${rules.earlyDeath.slow})`,
      detail: passed ? "21 crossed 50" : "no print",
    });
  }

  {
    const { k, d } = stochRsi(
      closes,
      rules.stochRsi.rsiPeriod,
      rules.stochRsi.stochPeriod,
      rules.stochRsi.kSmooth,
      rules.stochRsi.dSmooth,
    );
    const kv = k[i];
    const low = kv != null && kv <= rules.stochRsi.dotted;
    const bounce =
      crossedUp(k, d, i) && (k[i - 1] == null || k[i - 1]! <= rules.stochRsi.dotted);
    const passed = Boolean(low || bounce);
    const require = rules.stochRsi.enabled;
    conditions.push({
      id: "stochRsi",
      enabled: require,
      passed,
      role: require ? "buy" : "confluence",
      label: `StochRSI near dotted line (${rules.stochRsi.dotted})`,
      detail: kv == null ? "warming up" : fmt(kv, 1),
    });
  }

  if (rules.rsi.enabled) {
    const series = rsi(closes, rules.rsi.period);
    const value = series[i];
    const passed = value != null && value < rules.rsi.max;
    conditions.push({
      id: "rsi",
      enabled: true,
      passed,
      role: "buy",
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
      role: "buy",
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
      role: "buy",
      label: `Vol ≥ ${rules.volumeSpike.multiplier}× SMA${rules.volumeSpike.period}`,
      detail: avg == null || avg <= 0 ? "warming up" : `${fmt(candle.volume / avg, 2)}×`,
    });
  }

  if (rules.pullback.enabled) {
    const passed = changePct != null && changePct <= rules.pullback.maxChangePct;
    conditions.push({
      id: "pullback",
      enabled: true,
      passed,
      role: "buy",
      label: `24h ≤ ${rules.pullback.maxChangePct}%`,
      detail: changePct == null ? "—" : `${fmt(changePct, 2)}%`,
    });
  }

  const buy = conditions.filter((c) => c.role === "buy");
  const matched = buy.length > 0 && buy.every((c) => c.passed);
  const warnHits = conditions.filter((c) => c.role === "warning" && c.passed);
  const reasons = buy.filter((c) => c.passed).map((c) => `${c.label} (${c.detail})`);
  const warnings = warnHits.map((c) => `${c.label} (${c.detail})`);
  const fingerprint = `${candle.openTime}|${rulesFingerprint(rules)}`;

  return {
    matched,
    warning: warnHits.length > 0,
    price: candle.close,
    candleOpenTime: candle.openTime,
    conditions,
    reasons,
    warnings,
    fingerprint,
  };
}
