import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_INTERVAL, DEFAULT_RULES, DEFAULT_WATCHLIST, SIGNALS_CAP } from "./defaults";
import type { BuyRules, Interval, ScanSignal } from "./types";

export type ScannerState = {
  watchlist: string[];
  selected: string;
  interval: Interval;
  scanning: boolean;
  rules: BuyRules;
  signals: ScanSignal[];
  seenFingerprints: Record<string, string>;
  setWatchlist: (symbols: string[]) => void;
  addSymbol: (symbol: string) => boolean;
  removeSymbol: (symbol: string) => void;
  select: (symbol: string) => void;
  setInterval: (interval: Interval) => void;
  setScanning: (scanning: boolean) => void;
  setRules: (patch: Partial<BuyRules> | ((current: BuyRules) => BuyRules)) => void;
  pushSignal: (signal: ScanSignal) => boolean;
  clearSignals: () => void;
};

export const useScannerStore = create<ScannerState>()(
  persist(
    (set, get) => ({
      watchlist: [...DEFAULT_WATCHLIST],
      selected: DEFAULT_WATCHLIST[0]!,
      interval: DEFAULT_INTERVAL,
      scanning: true,
      rules: DEFAULT_RULES,
      signals: [],
      seenFingerprints: {},
      setWatchlist: (symbols) =>
        set({
          watchlist: symbols,
          selected: symbols.includes(get().selected) ? get().selected : (symbols[0] ?? ""),
        }),
      addSymbol: (symbol) => {
        const { watchlist } = get();
        if (watchlist.includes(symbol) || watchlist.length >= 24) return false;
        set({ watchlist: [...watchlist, symbol], selected: symbol });
        return true;
      },
      removeSymbol: (symbol) => {
        const watchlist = get().watchlist.filter((s) => s !== symbol);
        const selected = get().selected === symbol ? (watchlist[0] ?? "") : get().selected;
        set({ watchlist, selected });
      },
      select: (symbol) => set({ selected: symbol }),
      setInterval: (interval) => set({ interval, seenFingerprints: {} }),
      setScanning: (scanning) => set({ scanning }),
      setRules: (patch) =>
        set((state) => ({
          rules: typeof patch === "function" ? patch(state.rules) : { ...state.rules, ...patch },
          seenFingerprints: {},
        })),
      pushSignal: (signal) => {
        const key = `${signal.symbol}|${signal.interval}`;
        if (get().seenFingerprints[key] === signal.fingerprint) return false;
        set((state) => ({
          seenFingerprints: { ...state.seenFingerprints, [key]: signal.fingerprint },
          signals: [signal, ...state.signals].slice(0, SIGNALS_CAP),
        }));
        return true;
      },
      clearSignals: () => set({ signals: [], seenFingerprints: {} }),
    }),
    {
      name: "mh.crypto-scanner.v2-lifer",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ScannerState>;
        return {
          ...current,
          ...p,
          rules: { ...DEFAULT_RULES, ...(p.rules ?? {}) },
        };
      },
      partialize: (state) => ({
        watchlist: state.watchlist,
        selected: state.selected,
        interval: state.interval,
        scanning: state.scanning,
        rules: state.rules,
        signals: state.signals.slice(0, 40),
        seenFingerprints: state.seenFingerprints,
      }),
    },
  ),
);
