import { createServerFn } from "@tanstack/react-start";
import {
  getEnvLiveGate,
  resolveWeexCreds,
  setEnvKilled,
  setEnvLiveArmed,
  weexCancelOpen,
  weexEnvConfigured,
  weexGetAccount,
  weexGetCoins,
  weexGetSymbol,
  weexPlaceMarketBuy,
  type WeexCreds,
} from "./weex-client";

type CredsPayload = {
  source: "env" | "session";
  creds?: WeexCreds | null;
};

function credsOf(data: CredsPayload): WeexCreds {
  return resolveWeexCreds(data.source, data.creds);
}

export const weexEnvStatus = createServerFn({ method: "POST" }).handler(async () => {
  return { configured: weexEnvConfigured(), envGate: getEnvLiveGate() };
});

export const weexDepositNetworks = createServerFn({ method: "POST" }).handler(async () => {
  return weexGetCoins();
});

export const weexSymbolInfo = createServerFn({ method: "POST" })
  .validator((d: { symbol: string }) => d)
  .handler(async ({ data }) => weexGetSymbol(data.symbol.replace(/[^A-Z0-9]/g, "").toUpperCase()));

export const weexAccount = createServerFn({ method: "POST" })
  .validator((d: CredsPayload) => d)
  .handler(async ({ data }) => weexGetAccount(credsOf(data)));

export const weexSetEnvArmed = createServerFn({ method: "POST" })
  .validator((d: { armed: boolean }) => d)
  .handler(async ({ data }) => setEnvLiveArmed(data.armed));

export const weexSetEnvKilled = createServerFn({ method: "POST" })
  .validator((d: { killed: boolean }) => d)
  .handler(async ({ data }) => setEnvKilled(data.killed));

export const weexLiveBuy = createServerFn({ method: "POST" })
  .validator(
    (
      d: CredsPayload & {
        symbol: string;
        quantity: string;
        clientOrderId: string;
        armed: boolean;
      },
    ) => d,
  )
  .handler(async ({ data }) => {
    if (!data.armed) throw new Error("Live trading is not armed");
    if (data.source === "env") {
      const gate = getEnvLiveGate();
      if (gate.killed) throw new Error("Kill switch is on");
      if (!gate.armed) throw new Error("Server env live gate is not armed");
    }
    const symbol = data.symbol.replace(/[^A-Z0-9]/g, "").toUpperCase();
    if (!/USDT$/.test(symbol)) throw new Error("Only USDT pairs");
    return weexPlaceMarketBuy(credsOf(data), symbol, data.quantity, data.clientOrderId.slice(0, 32));
  });

export const weexCancelWatchlist = createServerFn({ method: "POST" })
  .validator((d: CredsPayload & { symbols: string[] }) => d)
  .handler(async ({ data }) => {
    const creds = credsOf(data);
    let cancelled = 0;
    const errors: string[] = [];
    for (const raw of data.symbols.slice(0, 24)) {
      const symbol = raw.replace(/[^A-Z0-9]/g, "").toUpperCase();
      try {
        cancelled += await weexCancelOpen(creds, symbol);
      } catch (err) {
        errors.push(`${symbol}: ${err instanceof Error ? err.message : "cancel failed"}`);
      }
    }
    return { cancelled, errors };
  });
