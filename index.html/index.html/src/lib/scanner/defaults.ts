import type { BuyRules, Interval } from "./types";

export const DEFAULT_WATCHLIST = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "AVAXUSDT",
  "DOGEUSDT",
  "LINKUSDT",
] as const;

export const SUGGESTED_SYMBOLS = [
  "ADAUSDT",
  "ATOMUSDT",
  "LTCUSDT",
  "NEARUSDT",
  "SUIUSDT",
  "APTUSDT",
  "ARBUSDT",
  "UNIUSDT",
] as const;

export const DEFAULT_INTERVAL: Interval = "5m";

export const DEFAULT_RULES: BuyRules = {
  rsi: { enabled: true, period: 14, max: 35 },
  emaCross: { enabled: false, fast: 9, slow: 21 },
  volumeSpike: { enabled: true, period: 20, multiplier: 1.6 },
  vsSma: { enabled: false, period: 50, side: "above" },
  pullback: { enabled: false, maxChangePct: -3 },
};

export const SCAN_MS: Record<Interval, number> = {
  "1m": 12_000,
  "5m": 20_000,
  "15m": 30_000,
  "1h": 45_000,
  "4h": 60_000,
  "1d": 90_000,
};

export const KLINE_LIMIT = 200;
export const SIGNALS_CAP = 80;
