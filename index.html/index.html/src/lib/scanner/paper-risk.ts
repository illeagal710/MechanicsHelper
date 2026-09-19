import { formatQty, floorToStep } from "./weex-trade.ts";
import { lastClosedIndex, sma } from "./indicators.ts";
import type { PaperPlanView } from "./types.ts";

/** Proper Risk Management (YouTube FbLAelAw83Y): risk 1% of the paper account per long. */
export const PAPER_RISK_PCT = 1;

/** Target at least 3:1 versus the stop. */
export const REWARD_RATIO = 3;

/** Place the stop a hair under SMA 200 so it is clearly below the average. */
export const STOP_UNDER_FRAC = 0.0005;

export type Sma200Source = "current" | "last-setup";

export type PaperRiskInput = {
  equity: number;
  entry: number;
  sma200?: number | null;
  lastSetupSma200?: number | null;
  minTradeAmount?: number;
  stepSize?: number;
};

export type PaperRiskPlan =
  | {
      ok: true;
      equity: number;
      dollarRisk: number;
      sma200: number;
      sma200Source: Sma200Source;
      stop: number;
      stopPct: number;
      quote: number;
      quantity: number;
      quantityStr: string;
      target: number;
      rewardQuote: number;
    }
  | { ok: false; reason: string };

export type PaperPosition = {
  id: string;
  symbol: string;
  openedAt: number;
  candleOpenTime: number;
  entry: number;
  quantity: number;
  quote: number;
  stop: number;
  target: number;
  sma200: number;
  dollarRisk: number;
  clientOrderId: string;
};

/** Prefer the live SMA 200 if it is under entry; otherwise the last setup’s 200. */
export function pickStopSma200(
  current: number | null | undefined,
  lastSetup: number | null | undefined,
  entry: number,
): { value: number; source: Sma200Source } | null {
  if (!(entry > 0)) return null;
  if (current != null && Number.isFinite(current) && current > 0 && current < entry) {
    return { value: current, source: "current" };
  }
  if (lastSetup != null && Number.isFinite(lastSetup) && lastSetup > 0 && lastSetup < entry) {
    return { value: lastSetup, source: "last-setup" };
  }
  return null;
}

export function lastSma200(closes: number[]): number | null {
  if (closes.length < 200) return null;
  const series = sma(closes, 200);
  const i = lastClosedIndex(closes.length);
  return series[i] ?? series[series.length - 1] ?? null;
}

export function stopUnderSma200(sma200: number): number {
  return sma200 * (1 - STOP_UNDER_FRAC);
}

/**
 * Position size = dollar risk ÷ stop-loss percent (divide, not multiply).
 * Example: $10,000 × 1% = $100 risk; stop 3.05% → $100 / 0.0305 ≈ $3,279 notional.
 */
export function planPaperLong(input: PaperRiskInput): PaperRiskPlan {
  if (!(input.equity > 0)) return { ok: false, reason: "Paper account needs a positive balance" };
  if (!(input.entry > 0)) return { ok: false, reason: "Need an entry price to size the long" };
  const picked = pickStopSma200(input.sma200, input.lastSetupSma200, input.entry);
  if (!picked) {
    return {
      ok: false,
      reason: "Stop under SMA 200 needs the 200 (or last setup’s 200) below entry",
    };
  }
  const stop = stopUnderSma200(picked.value);
  if (!(stop > 0) || !(stop < input.entry)) {
    return { ok: false, reason: "Stop under SMA 200 is not below entry" };
  }
  const stopPct = (input.entry - stop) / input.entry;
  if (!(stopPct > 0)) return { ok: false, reason: "Stop-loss percent is zero" };
  const dollarRisk = input.equity * (PAPER_RISK_PCT / 100);
  const quoteRaw = dollarRisk / stopPct;
  const step = input.stepSize && input.stepSize > 0 ? input.stepSize : 1e-8;
  const qty = floorToStep(quoteRaw / input.entry, step);
  const minAmt = input.minTradeAmount && input.minTradeAmount > 0 ? input.minTradeAmount : 0;
  if (qty < minAmt) {
    return { ok: false, reason: `Quantity ${qty} is below minTradeAmount ${minAmt}` };
  }
  const quote = qty * input.entry;
  const riskPerUnit = input.entry - stop;
  const target = input.entry + REWARD_RATIO * riskPerUnit;
  return {
    ok: true,
    equity: input.equity,
    dollarRisk,
    sma200: picked.value,
    sma200Source: picked.source,
    stop,
    stopPct,
    quote,
    quantity: qty,
    quantityStr: formatQty(qty, step),
    target,
    rewardQuote: qty * (target - input.entry),
  };
}

export function paperStopHit(low: number, stop: number, candleOpenTime: number, openedOn: number): boolean {
  if (!(low > 0) || !(stop > 0)) return false;
  if (candleOpenTime <= openedOn) return false;
  return low <= stop;
}

export function stopOutPnl(position: Pick<PaperPosition, "entry" | "quantity" | "stop">): number {
  return (position.stop - position.entry) * position.quantity;
}

export function formatStopPct(stopPct: number): string {
  return `${(stopPct * 100).toFixed(2)}%`;
}

export function formatPaperPlan(plan: Extract<PaperRiskPlan, { ok: true }>): string {
  const src = plan.sma200Source === "last-setup" ? "last setup 200" : "SMA 200";
  return `size ${fmtUsd(plan.quote)} · stop ${fmtPx(plan.stop)} (${formatStopPct(plan.stopPct)} under ${src}) · target ${fmtPx(plan.target)} (3:1)`;
}

function fmtUsd(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDT`;
}

function fmtPx(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits });
}

export function toPlanView(plan: Extract<PaperRiskPlan, { ok: true }>): PaperPlanView {
  return {
    quote: plan.quote,
    quantity: plan.quantity,
    stop: plan.stop,
    target: plan.target,
    stopPct: plan.stopPct,
    dollarRisk: plan.dollarRisk,
    sma200: plan.sma200,
    sma200Source: plan.sma200Source,
    label: formatPaperPlan(plan),
  };
}
