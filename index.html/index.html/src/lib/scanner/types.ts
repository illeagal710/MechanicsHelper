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
  | "stretchMa"
  | "deathCross"
  | "earlyDeath"
  | "stochRsi"
  | "rsi"
  | "emaCross"
  | "volumeSpike"
  | "pullback";

export type ConditionRole = "buy" | "warning" | "confluence";

export type SignalKind = "long" | "stretch" | "death" | "early";

export type BuyRules = {
  nearMa: { enabled: boolean; period: number };
  vsSma: { enabled: boolean; fast: number; period: number; side: "above" | "below" };
  stretchMa: { enabled: boolean; period: number; atrPeriod: number; atrMult: number };
  deathCross: { enabled: boolean; fast: number; slow: number };
  earlyDeath: { enabled: boolean; fast: number; slow: number };
  stochRsi: {
    enabled: boolean;
    rsiPeriod: number;
    stochPeriod: number;
    kSmooth: number;
    dSmooth: number;
    dotted: number;
  };
  jdStoch: {
    display: boolean;
    kLength: number;
    kSmooth: number;
    dSmooth: number;
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
  role: ConditionRole;
  label: string;
  detail: string;
};

export type SetupEval = {
  matched: boolean;
  warning: boolean;
  price: number;
  candleOpenTime: number;
  conditions: ConditionResult[];
  reasons: string[];
  warnings: string[];
  fingerprint: string;
};

export type ScanSignal = {
  id: string;
  kind: SignalKind;
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
