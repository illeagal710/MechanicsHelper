/** Simple moving average of `period` values — TradingView `ta.sma`, no extra smoothing. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: values.length }, () => null);
  if (period < 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: values.length }, () => null);
  if (period < 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i]!;
  let prev = sum / period;
  out[period - 1] = prev;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder RSI. Index `period` is the first defined value. */
export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: closes.length }, () => null);
  if (period < 1 || closes.length < period + 1) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const delta = closes[i]! - closes[i - 1]!;
    if (delta >= 0) gain += delta;
    else loss -= delta;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i]! - closes[i - 1]!;
    const g = delta > 0 ? delta : 0;
    const l = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/** Stochastic RSI %K / %D on a 0–100 scale. TradingView default 14,14,3,3. */
export function stochRsi(
  closes: number[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kSmooth = 3,
  dSmooth = 3,
): { k: (number | null)[]; d: (number | null)[] } {
  const rsiSeries = rsi(closes, rsiPeriod);
  const raw: (number | null)[] = Array.from({ length: closes.length }, () => null);
  for (let i = 0; i < rsiSeries.length; i++) {
    if (i + 1 < rsiPeriod + stochPeriod) continue;
    const window: number[] = [];
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      const v = rsiSeries[j];
      if (v == null) {
        window.length = 0;
        break;
      }
      window.push(v);
    }
    if (window.length < stochPeriod) continue;
    const min = Math.min(...window);
    const max = Math.max(...window);
    const current = rsiSeries[i]!;
    raw[i] = max === min ? 50 : ((current - min) / (max - min)) * 100;
  }
  const k = smaSparse(raw, kSmooth);
  const d = smaSparse(k, dSmooth);
  return { k, d };
}

function smaSparse(values: (number | null)[], period: number): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: values.length }, () => null);
  if (period < 1) return out;
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < period) continue;
    let sum = 0;
    let ok = true;
    for (let j = i - period + 1; j <= i; j++) {
      const v = values[j];
      if (v == null) {
        ok = false;
        break;
      }
      sum += v;
    }
    if (ok) out[i] = sum / period;
  }
  return out;
}

export function crossedUp(
  fast: (number | null)[],
  slow: (number | null)[],
  index: number,
): boolean {
  if (index < 1) return false;
  const f0 = fast[index - 1];
  const s0 = slow[index - 1];
  const f1 = fast[index];
  const s1 = slow[index];
  if (f0 == null || s0 == null || f1 == null || s1 == null) return false;
  return f0 <= s0 && f1 > s1;
}

export function lastClosedIndex(length: number): number {
  if (length < 2) return Math.max(0, length - 1);
  return length - 2;
}

export function fmtNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const d = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", { maximumFractionDigits: digits ?? d, minimumFractionDigits: 0 });
}

export function fmtPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(2, digits),
    maximumFractionDigits: digits,
  });
}
