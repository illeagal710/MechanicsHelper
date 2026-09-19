import { weexAccount, weexCancelWatchlist, weexLiveBuy, weexSymbolInfo } from "./weex-api";
import { loadLocalCreds } from "./weex-creds";
import {
  formatPaperPlan,
  paperStopHit,
  planPaperLong,
  stopOutPnl,
  type PaperPosition,
} from "./paper-risk";
import { useWeexStore } from "./weex-store";
import { clientOrderId, resolveTradeAction, sizeBuy, type FillRecord } from "./weex-trade";

export type EntryInput = {
  symbol: string;
  price: number;
  candleOpenTime: number;
  reasons: string[];
  source: "signal" | "manual-paper";
  watchlist: string[];
  sma200?: number | null;
  lastSetupSma200?: number | null;
};

function credsPayload() {
  return { source: "session" as const, creds: loadLocalCreds() };
}

export async function executeLifersEntry(input: EntryInput): Promise<FillRecord | null> {
  const state = useWeexStore.getState();
  const action = resolveTradeAction({
    execution: state.execution,
    liveArmed: state.liveArmed,
    killed: state.killed,
  });
  const cid = clientOrderId(input.symbol, input.candleOpenTime);
  const base: Omit<FillRecord, "status" | "orderId" | "error" | "quantity" | "quote"> = {
    id: `${cid}-${Date.now()}`,
    at: Date.now(),
    mode: action === "live" ? "live" : "paper",
    symbol: input.symbol,
    side: "BUY",
    price: input.price,
    clientOrderId: cid,
    reason: input.reasons.join(" · ") || "Crypto Lifers buy setup",
  };

  if (action === "skip") {
    if (input.source === "signal") return null;
    const fill: FillRecord = {
      ...base,
      quantity: 0,
      quote: 0,
      status: "blocked",
      orderId: null,
      error: state.killed ? "Kill switch is on" : "Alerts-only — no order",
    };
    state.pushFill(fill);
    return fill;
  }

  if (action === "live" && !loadLocalCreds()) {
    const fill: FillRecord = {
      ...base,
      quantity: 0,
      quote: 0,
      status: "rejected",
      orderId: null,
      error: "Connect WEEX in this app first (keys stay on this machine)",
    };
    state.pushFill(fill);
    return fill;
  }

  let freeUsdt = state.paperUsdt;
  let minTradeAmount = 0.000001;
  let stepSize = 0.000001;
  try {
    const info = await weexSymbolInfo({ data: { symbol: input.symbol } });
    minTradeAmount = info.minTradeAmount || minTradeAmount;
    stepSize = info.stepSize || stepSize;
  } catch {
    /* paper can still size with defaults */
  }
  if (action === "live" && state.connected && loadLocalCreds()) {
    try {
      const acct = await weexAccount({ data: credsPayload() });
      if (acct.usdtFree > 0) freeUsdt = acct.usdtFree;
    } catch {
      /* keep paper virtual */
    }
  }

  if (action === "paper") {
    if (state.openPapers.some((p) => p.symbol === input.symbol)) {
      const fill: FillRecord = {
        ...base,
        mode: "paper",
        quantity: 0,
        quote: 0,
        status: "blocked",
        orderId: null,
        error: `Paper long already open in ${input.symbol}`,
      };
      if (input.source === "manual-paper") state.pushFill(fill);
      return input.source === "manual-paper" ? fill : null;
    }
    const plan = planPaperLong({
      equity: state.paperUsdt,
      entry: input.price,
      sma200: input.sma200,
      lastSetupSma200: input.lastSetupSma200,
      minTradeAmount,
      stepSize,
    });
    if (!plan.ok) {
      const fill: FillRecord = {
        ...base,
        mode: "paper",
        quantity: 0,
        quote: 0,
        status: "rejected",
        orderId: null,
        error: plan.reason,
      };
      state.pushFill(fill);
      return fill;
    }
    const fill: FillRecord = {
      ...base,
      mode: "paper",
      quantity: plan.quantity,
      quote: plan.quote,
      status: "simulated",
      orderId: null,
      error: null,
      stop: plan.stop,
      target: plan.target,
      sma200: plan.sma200,
      dollarRisk: plan.dollarRisk,
      reason: `${base.reason} · ${formatPaperPlan(plan)}`,
    };
    const position: PaperPosition = {
      id: fill.id,
      symbol: input.symbol,
      openedAt: fill.at,
      candleOpenTime: input.candleOpenTime,
      entry: input.price,
      quantity: plan.quantity,
      quote: plan.quote,
      stop: plan.stop,
      target: plan.target,
      sma200: plan.sma200,
      dollarRisk: plan.dollarRisk,
      clientOrderId: cid,
    };
    state.pushFill(fill);
    state.openPaper(position);
    return fill;
  }

  const sized = sizeBuy({
    freeUsdt,
    lastPrice: input.price,
    pct: state.sizePct,
    maxQuote: state.maxQuote,
    minQuote: state.minQuote,
    minTradeAmount,
    stepSize,
  });
  if (!sized.ok) {
    const fill: FillRecord = {
      ...base,
      quantity: 0,
      quote: 0,
      status: "rejected",
      orderId: null,
      error: sized.reason,
    };
    state.pushFill(fill);
    return fill;
  }

  try {
    const placed = await weexLiveBuy({
      data: {
        ...credsPayload(),
        symbol: input.symbol,
        quantity: sized.quantityStr,
        clientOrderId: cid,
        armed: true,
      },
    });
    const fill: FillRecord = {
      ...base,
      mode: "live",
      quantity: Number(placed.executedQty ?? sized.quantity) || sized.quantity,
      quote: Number(placed.cummulativeQuoteQty ?? sized.quote) || sized.quote,
      status: placed.status === "FILLED" ? "filled" : "submitted",
      orderId: placed.orderId || null,
      error: null,
    };
    state.pushFill(fill);
    return fill;
  } catch (err) {
    const fill: FillRecord = {
      ...base,
      mode: "live",
      quantity: sized.quantity,
      quote: sized.quote,
      status: "rejected",
      orderId: null,
      error: err instanceof Error ? err.message : "WEEX order failed",
    };
    state.pushFill(fill);
    return fill;
  }
}

export function recordPaperStopOut(position: PaperPosition): FillRecord {
  const pnl = stopOutPnl(position);
  const equityAfter = useWeexStore.getState().paperUsdt + pnl;
  const fill: FillRecord = {
    id: `${position.id}-stop`,
    at: Date.now(),
    mode: "paper",
    symbol: position.symbol,
    side: "SELL",
    quantity: position.quantity,
    price: position.stop,
    quote: position.quantity * position.stop,
    status: "stopped-out",
    orderId: null,
    clientOrderId: position.clientOrderId,
    reason: `Simulated stop-out under SMA 200 @ ${position.stop} · P&L ${pnl.toFixed(2)} USDT`,
    error: null,
    stop: position.stop,
    target: position.target,
    sma200: position.sma200,
    dollarRisk: position.dollarRisk,
    pnl,
  };
  useWeexStore.getState().closePaper(position.id, fill, equityAfter);
  return fill;
}

/** Paper-only: log a simulated stop-out for an open long. Never hits WEEX. */
export function simulatePaperStopOut(positionId?: string): FillRecord | null {
  const state = useWeexStore.getState();
  const position = positionId
    ? state.openPapers.find((p) => p.id === positionId)
    : state.openPapers[0];
  if (!position) return null;
  return recordPaperStopOut(position);
}

export function checkPaperStopOuts(
  symbol: string,
  candles: { openTime: number; low: number }[],
): FillRecord[] {
  const state = useWeexStore.getState();
  const hits = state.openPapers.filter((p) => p.symbol === symbol);
  const out: FillRecord[] = [];
  for (const position of hits) {
    const through = candles.some((c) =>
      paperStopHit(c.low, position.stop, c.openTime, position.candleOpenTime),
    );
    if (through) out.push(recordPaperStopOut(position));
  }
  return out;
}

export async function tripKillSwitch(watchlist: string[]): Promise<{ cancelled: number; errors: string[] }> {
  const state = useWeexStore.getState();
  state.setKilled(true);
  const errors: string[] = [];
  let cancelled = 0;
  if (loadLocalCreds()) {
    try {
      const result = await weexCancelWatchlist({ data: { ...credsPayload(), symbols: watchlist } });
      cancelled = result.cancelled;
      errors.push(...result.errors);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "cancel failed");
    }
  }
  return { cancelled, errors };
}

export async function armLive(armed: boolean) {
  const state = useWeexStore.getState();
  if (armed && state.killed) throw new Error("Clear the kill switch before arming live");
  if (armed && state.execution !== "live") throw new Error("Select Live before arming");
  state.setLiveArmed(armed);
}
