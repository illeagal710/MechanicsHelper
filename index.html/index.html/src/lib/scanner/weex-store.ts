import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_MAX_QUOTE,
  DEFAULT_MIN_QUOTE,
  DEFAULT_PAPER_USDT,
  DEFAULT_SIZE_PCT,
  FILLS_CAP,
  type ExecutionMode,
  type FillRecord,
} from "./weex-trade";

export type WeexState = {
  execution: ExecutionMode;
  liveArmed: boolean;
  killed: boolean;
  connected: boolean;
  sizePct: number;
  maxQuote: number;
  minQuote: number;
  paperUsdt: number;
  fills: FillRecord[];
  setExecution: (execution: ExecutionMode) => void;
  setLiveArmed: (liveArmed: boolean) => void;
  setKilled: (killed: boolean) => void;
  setConnected: (connected: boolean) => void;
  setSizing: (patch: Partial<Pick<WeexState, "sizePct" | "maxQuote" | "minQuote" | "paperUsdt">>) => void;
  pushFill: (fill: FillRecord) => void;
  clearFills: () => void;
};

export const useWeexStore = create<WeexState>()(
  persist(
    (set) => ({
      execution: "paper",
      liveArmed: false,
      killed: false,
      connected: false,
      sizePct: DEFAULT_SIZE_PCT,
      maxQuote: DEFAULT_MAX_QUOTE,
      minQuote: DEFAULT_MIN_QUOTE,
      paperUsdt: DEFAULT_PAPER_USDT,
      fills: [],
      setExecution: (execution) => set({ execution, liveArmed: false }),
      setLiveArmed: (liveArmed) =>
        set((s) => ({ liveArmed, killed: liveArmed ? false : s.killed })),
      setKilled: (killed) => set((s) => ({ killed, liveArmed: killed ? false : s.liveArmed })),
      setConnected: (connected) => set({ connected }),
      setSizing: (patch) => set(patch),
      pushFill: (fill) =>
        set((state) => ({ fills: [fill, ...state.fills].slice(0, FILLS_CAP) })),
      clearFills: () => set({ fills: [] }),
    }),
    {
      name: "mh.weex-trade.v1",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WeexState>;
        return {
          ...current,
          ...p,
          liveArmed: false,
          connected: false,
        };
      },
      partialize: (state) => ({
        execution: state.execution === "live" ? "paper" : state.execution,
        killed: state.killed,
        sizePct: state.sizePct,
        maxQuote: state.maxQuote,
        minQuote: state.minQuote,
        paperUsdt: state.paperUsdt,
        fills: state.fills.slice(0, 40),
      }),
    },
  ),
);
