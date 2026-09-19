import type { BuyRules, Interval } from "./types";

export const SETUP_NAME = "Crypto Lifers / Sam Price";

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

/** Sam Price: "do this on the four hour and above." */
export const DEFAULT_INTERVAL: Interval = "4h";

/**
 * Public Crypto Lifers buy setup:
 * LIFER_5ma SMAs (21 white, 50 red, 80 purple, 100 blue, 200 yellow);
 * get in when price is on/near the 21; higher-odds when also above the 200;
 * StochRSI reset as timing (not buying the gap-away). Alerts only.
 */
export const DEFAULT_RULES: BuyRules = {
  nearMa: { enabled: true, period: 21, maxPct: 2.5 },
  vsSma: { enabled: true, period: 200, side: "above" },
  stochRsi: {
    enabled: true,
    rsiPeriod: 14,
    stochPeriod: 14,
    kSmooth: 3,
    dSmooth: 3,
    max: 30,
  },
  rsi: { enabled: false, period: 14, max: 35 },
  emaCross: { enabled: false, fast: 9, slow: 21 },
  volumeSpike: { enabled: false, period: 20, multiplier: 1.6 },
  pullback: { enabled: false, maxChangePct: -3 },
};

export const LIFER_MAS = [21, 50, 200] as const;

export const SCAN_MS: Record<Interval, number> = {
  "1m": 12_000,
  "5m": 20_000,
  "15m": 30_000,
  "1h": 45_000,
  "4h": 60_000,
  "1d": 90_000,
};

/** Enough history for SMA 200 on the last 120 chart bars. */
export const KLINE_LIMIT = 400;
export const SIGNALS_CAP = 80;
