import { fetchKlines, fetchTicker, fetchTickers } from "./market-api";
import type { Candle, Interval, Ticker } from "./types";

export async function loadKlines(symbol: string, interval: Interval, limit = 200): Promise<Candle[]> {
  return fetchKlines({ data: { symbol, interval, limit } });
}

export async function loadTickers(symbols: string[]): Promise<Ticker[]> {
  if (symbols.length === 0) return [];
  return fetchTickers({ data: { symbols } });
}

export async function loadTicker(symbol: string): Promise<Ticker> {
  return fetchTicker({ data: { symbol } });
}

export function normalizeSymbol(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isUsdtSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{5,20}USDT$/.test(symbol) && symbol !== "USDT";
}
