export const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = (typeof INTERVALS)[number];

export type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

export type Ticker = {
  symbol: string;
  lastPrice: number;
  changePct: number;
  volume: number;
  quoteVolume: number;
};

export type ConditionId =
  | "nearMa"
  | "vsSma"
  | "stochRsi"
  | "rsi"
  | "emaCross"
  | "volumeSpike"
  | "pullback";

export type BuyRules = {
  nearMa: { enabled: boolean; period: number; maxPct: number };
  vsSma: { enabled: boolean; period: number; side: "above" | "below" };
  stochRsi: {
    enabled: boolean;
    rsiPeriod: number;
    stochPeriod: number;
    kSmooth: number;
    dSmooth: number;
    max: number;
  };
  rsi: { enabled: boolean; period: number; max: number };
  emaCross: { enabled: boolean; fast: number; slow: number };
  volumeSpike: { enabled: boolean; period: number; multiplier: number };
  pullback: { enabled: boolean; maxChangePct: number };
};

export type ConditionResult = {
  id: ConditionId;
  enabled: boolean;
  passed: boolean;
  label: string;
  detail: string;
};

export type SetupEval = {
  matched: boolean;
  price: number;
  candleOpenTime: number;
  conditions: ConditionResult[];
  reasons: string[];
  fingerprint: string;
};

export type ScanSignal = {
  id: string;
  symbol: string;
  interval: Interval;
  at: number;
  price: number;
  candleOpenTime: number;
  fingerprint: string;
  reasons: string[];
};

export type SymbolScan = {
  symbol: string;
  ticker: Ticker | null;
  eval: SetupEval | null;
  error: string | null;
  updatedAt: number;
};
