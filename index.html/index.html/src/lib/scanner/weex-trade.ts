export const WEEX_SPOT = "https://api-spot.weex.com";
export const WEEX_DEPOSIT_URL = "https://www.weex.com/spot/assets/deposit";
export const WEEX_API_KEYS_URL = "https://www.weex.com/spot/account/apiManagement";

export type ExecutionMode = "alerts" | "paper" | "live";

export type TradeGate = {
  execution: ExecutionMode;
  liveArmed: boolean;
  killed: boolean;
};

export type SizeInput = {
  freeUsdt: number;
  lastPrice: number;
  pct: number;
  maxQuote: number;
  minQuote: number;
  minTradeAmount: number;
  stepSize: number;
};

export type SizeResult =
  | { ok: true; quantity: number; quote: number; quantityStr: string }
  | { ok: false; reason: string };

export type WeexNetwork = {
  coin: string;
  network: string;
  name: string;
  isDefault: boolean;
  depositEnable: boolean;
  depositDust: string;
  minConfirm: number;
};

export type WeexAccountView = {
  canTrade: boolean;
  canDeposit: boolean;
  uid: number | null;
  balances: { asset: string; free: number; locked: number }[];
  usdtFree: number;
  usdtLocked: number;
};

export type FillRecord = {
  id: string;
  at: number;
  mode: "paper" | "live";
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  quote: number;
  status: "simulated" | "submitted" | "filled" | "rejected" | "cancelled" | "blocked" | "stopped-out";
  orderId: string | null;
  clientOrderId: string;
  reason: string;
  error: string | null;
  stop?: number | null;
  target?: number | null;
  sma200?: number | null;
  dollarRisk?: number | null;
  pnl?: number | null;
};

export const DEFAULT_SIZE_PCT = 5;
export const DEFAULT_MAX_QUOTE = 50;
export const DEFAULT_MIN_QUOTE = 10;
export const DEFAULT_PAPER_USDT = 10_000;
export const FILLS_CAP = 80;

/** Live orders only when Live is selected, Arm is on, and Kill is off. */
export function resolveTradeAction(gate: TradeGate): "skip" | "paper" | "live" {
  if (gate.killed) return "skip";
  if (gate.execution === "alerts") return "skip";
  if (gate.execution === "live" && gate.liveArmed) return "live";
  return "paper";
}

export function floorToStep(value: number, step: number): number {
  if (!(step > 0) || !Number.isFinite(value)) return value;
  const n = Math.floor((value + Number.EPSILON) / step) * step;
  return Number(n.toFixed(12));
}

export function stepDecimals(step: number): number {
  if (!(step > 0) || step >= 1) return 0;
  const s = step.toFixed(12).replace(/0+$/, "");
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(12, s.length - i - 1);
}

export function formatQty(qty: number, step: number): string {
  return floorToStep(qty, step).toFixed(stepDecimals(step));
}

export function sizeBuy(input: SizeInput): SizeResult {
  if (!(input.lastPrice > 0)) return { ok: false, reason: "Need a last price to size the order" };
  const pct = Math.min(100, Math.max(0.1, input.pct));
  const rawQuote = Math.min(input.freeUsdt * (pct / 100), input.maxQuote, input.freeUsdt);
  if (!(rawQuote > 0)) return { ok: false, reason: "No USDT available to size a buy" };
  if (rawQuote + 1e-8 < input.minQuote) {
    return { ok: false, reason: `Quote ${rawQuote.toFixed(2)} USDT is below the ${input.minQuote} minimum` };
  }
  const step = input.stepSize > 0 ? input.stepSize : 1e-8;
  const qty = floorToStep(rawQuote / input.lastPrice, step);
  if (qty < input.minTradeAmount) {
    return { ok: false, reason: `Quantity ${qty} is below WEEX minTradeAmount ${input.minTradeAmount}` };
  }
  const quote = qty * input.lastPrice;
  return { ok: true, quantity: qty, quote, quantityStr: formatQty(qty, step) };
}

export function clientOrderId(symbol: string, candleOpenTime: number): string {
  const raw = `mh${symbol}${candleOpenTime}`.replace(/[^a-zA-Z0-9]/g, "");
  return raw.slice(0, 32);
}
