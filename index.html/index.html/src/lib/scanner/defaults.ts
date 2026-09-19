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

/** 4h is the 21 SMA × 200 SMA cross chart (Discord 2022-07-17 clip — not YouTube FbLAelAw83Y). */
export const DEFAULT_INTERVAL: Interval = "4h";

/**
 * Alert defaults (not live orders):
 * Primary 4h long = SMA 21 crosses above SMA 200. Continuation = 21 already above
 * and price on/flagging the 21 (wick touch, no % band). Stretch off the 21 is an
 * exit warning. Death cross = 4h SMA 50 below/crossing 200; early warning = 21×50.
 * StochRSI dotted-line/low and JD 40/4/1 are confluence display.
 */
export const DEFAULT_RULES: BuyRules = {
  nearMa: { enabled: false, period: 21 },
  vsSma: { enabled: true, fast: 21, period: 200, side: "above" },
  stretchMa: { enabled: true, period: 21, atrPeriod: 14, atrMult: 1.5 },
  deathCross: { enabled: true, fast: 50, slow: 200 },
  earlyDeath: { enabled: true, fast: 21, slow: 50 },
  stochRsi: {
    enabled: false,
    rsiPeriod: 14,
    stochPeriod: 14,
    kSmooth: 3,
    dSmooth: 3,
    dotted: 20,
  },
  jdStoch: { display: true, kLength: 40, kSmooth: 4, dSmooth: 1 },
  rsi: { enabled: false, period: 14, max: 35 },
  emaCross: { enabled: false, fast: 9, slow: 21 },
  volumeSpike: { enabled: false, period: 20, multiplier: 1.6 },
  pullback: { enabled: false, maxChangePct: -3 },
};

/** Official Crypto Lifer Pre-Trade Check List (human ticks — alerts only). */
export const PRETRADE_CHECKS = [
  "Is the price creating a bullish pattern?",
  "Is the price at the bottom of the trend line in the pattern?",
  "Is the price in the last 25% of the pattern?",
  "Is the MACD turning in a bullish way?",
  "Is the blue line curving up towards the red line?",
  "Is the RSI and the Stochs in a bullish pattern close to oversold or at least below 50?",
  "Are shorter moving averages curving towards longer moving averages?",
  "Are there any divergences?",
  "Is there any significant support and resistance?",
] as const;

/** Visible Range Volume Profile — how Sam adds it (confluence, not an auto alert). */
export const VRVP_SETTINGS = {
  name: "Visible Range Volume Profile",
  timeframe: "4h",
  rowSize: 240,
  volume: "Up/Down",
  valueArea: 70,
  rule: "Thick nodes are resistance. Empty profile = continuation toward the next high-volume node.",
} as const;

export const HUNT_FILTER =
  "Hunt low 4h + high 1h, then time the entry on 15m (break/flag). Alerts only.";

export function mergeRules(partial?: Partial<BuyRules> | null): BuyRules {
  const p = partial ?? {};
  return {
    nearMa: { ...DEFAULT_RULES.nearMa, ...(p.nearMa ?? {}) },
    vsSma: { ...DEFAULT_RULES.vsSma, ...(p.vsSma ?? {}) },
    stretchMa: { ...DEFAULT_RULES.stretchMa, ...(p.stretchMa ?? {}) },
    deathCross: { ...DEFAULT_RULES.deathCross, ...(p.deathCross ?? {}) },
    earlyDeath: { ...DEFAULT_RULES.earlyDeath, ...(p.earlyDeath ?? {}) },
    stochRsi: { ...DEFAULT_RULES.stochRsi, ...(p.stochRsi ?? {}) },
    jdStoch: { ...DEFAULT_RULES.jdStoch, ...(p.jdStoch ?? {}) },
    rsi: { ...DEFAULT_RULES.rsi, ...(p.rsi ?? {}) },
    emaCross: { ...DEFAULT_RULES.emaCross, ...(p.emaCross ?? {}) },
    volumeSpike: { ...DEFAULT_RULES.volumeSpike, ...(p.volumeSpike ?? {}) },
    pullback: { ...DEFAULT_RULES.pullback, ...(p.pullback ?? {}) },
  };
}

/** Official LIFER_5ma: ta.sma(close, n), no extra smoothing. */
export const LIFER_MAS = [21, 50, 80, 100, 200] as const;

/** TradingView color.white / red / purple / blue / yellow */
export const LIFER_MA_COLORS = {
  21: "#ffffff",
  50: "#ff0000",
  80: "#800080",
  100: "#0000ff",
  200: "#ffff00",
} as const;

/** color.new(color.gray, 90) — Pine transparency 90 ≈ 10% opaque. */
export const LIFER_FILL = "rgba(128, 128, 128, 0.10)";

export const JD_STOCH_COLOR = "#ffff00";

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

export const SCANNER_PERSIST_KEY = "mh.crypto-scanner.v4-lifer";
export const CHECKLIST_PERSIST_KEY = "mh.crypto-scanner.checklist.v1";
