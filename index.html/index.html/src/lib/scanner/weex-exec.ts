import { weexAccount, weexCancelWatchlist, weexLiveBuy, weexSymbolInfo } from "./weex-api";
import { loadLocalCreds } from "./weex-creds";
import { useWeexStore } from "./weex-store";
import { clientOrderId, resolveTradeAction, sizeBuy, type FillRecord } from "./weex-trade";

export type EntryInput = {
  symbol: string;
  price: number;
  candleOpenTime: number;
  reasons: string[];
  source: "signal" | "manual-paper";
  watchlist: string[];
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
  if (state.connected && loadLocalCreds()) {
    try {
      const acct = await weexAccount({ data: credsPayload() });
      if (acct.usdtFree > 0) freeUsdt = acct.usdtFree;
    } catch {
      /* keep paper virtual */
    }
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

  if (action === "paper") {
    const fill: FillRecord = {
      ...base,
      mode: "paper",
      quantity: sized.quantity,
      quote: sized.quote,
      status: "simulated",
      orderId: null,
      error: null,
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
