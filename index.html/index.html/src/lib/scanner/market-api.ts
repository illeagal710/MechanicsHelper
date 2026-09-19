import { createServerFn } from "@tanstack/react-start";
import type { Candle, Interval, Ticker } from "./types";

const HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];

async function binanceGet(path: string): Promise<unknown> {
  let lastError = "Binance unreachable";
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 451) {
        lastError = `Binance ${host} geo-restricted`;
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastError = `Binance ${res.status}${body ? `: ${body.slice(0, 180)}` : ""}`;
        continue;
      }
      return res.json();
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Binance fetch failed";
    }
  }
  throw new Error(lastError);
}

function num(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error("invalid number from Binance");
  return n;
}

function parseKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) throw new Error("Binance klines: expected array");
  return raw.map((row) => {
    if (!Array.isArray(row) || row.length < 7) throw new Error("Binance klines: bad row");
    return {
      openTime: num(row[0] as string | number),
      open: num(row[1] as string),
      high: num(row[2] as string),
      low: num(row[3] as string),
      close: num(row[4] as string),
      volume: num(row[5] as string),
      closeTime: num(row[6] as string | number),
    };
  });
}

function parseTicker(raw: unknown): Ticker {
  if (!raw || typeof raw !== "object") throw new Error("Binance ticker: bad payload");
  const t = raw as Record<string, unknown>;
  return {
    symbol: String(t.symbol ?? ""),
    lastPrice: num(String(t.lastPrice ?? "")),
    changePct: num(String(t.priceChangePercent ?? "")),
    volume: num(String(t.volume ?? "0")),
    quoteVolume: num(String(t.quoteVolume ?? "0")),
  };
}

const INTERVALS = new Set(["1m", "5m", "15m", "1h", "4h", "1d"]);

function cleanSymbol(symbol: string): string {
  const s = symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(s)) throw new Error("Invalid symbol");
  return s;
}

export const fetchKlines = createServerFn({ method: "POST" })
  .validator((d: { symbol: string; interval: Interval; limit?: number }) => d)
  .handler(async ({ data }): Promise<Candle[]> => {
    const symbol = cleanSymbol(data.symbol);
    if (!INTERVALS.has(data.interval)) throw new Error("Invalid interval");
    const limit = Math.min(500, Math.max(20, Math.floor(data.limit ?? 200)));
    const raw = await binanceGet(
      `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${data.interval}&limit=${limit}`,
    );
    return parseKlines(raw);
  });

export const fetchTickers = createServerFn({ method: "POST" })
  .validator((d: { symbols: string[] }) => d)
  .handler(async ({ data }): Promise<Ticker[]> => {
    const symbols = [...new Set(data.symbols.map(cleanSymbol))].slice(0, 30);
    if (symbols.length === 0) return [];
    const raw = await binanceGet(
      `/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`,
    );
    if (!Array.isArray(raw)) throw new Error("Binance tickers: expected array");
    return raw.map(parseTicker);
  });

export const fetchTicker = createServerFn({ method: "POST" })
  .validator((d: { symbol: string }) => d)
  .handler(async ({ data }): Promise<Ticker> => {
    const symbol = cleanSymbol(data.symbol);
    const raw = await binanceGet(`/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`);
    return parseTicker(raw);
  });
