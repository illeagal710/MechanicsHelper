import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { ScannerChart } from "@/components/scanner-chart";
import { DEFAULT_INTERVAL, DEFAULT_RULES, SCAN_MS, SETUP_NAME, SUGGESTED_SYMBOLS } from "@/lib/scanner/defaults";
import { fmtPrice } from "@/lib/scanner/indicators";
import { isUsdtSymbol, loadKlines, loadTicker, loadTickers, normalizeSymbol } from "@/lib/scanner/market";
import { evaluateSetup } from "@/lib/scanner/rules";
import { useScannerStore } from "@/lib/scanner/scanner-store";
import { INTERVALS, type Candle, type Interval, type SymbolScan } from "@/lib/scanner/types";
import { LanguageToggle } from "@/lib/i18n-context";
import { ThemeToggle } from "@/lib/theme-context";

export function ScannerApp() {
  const watchlist = useScannerStore((s) => s.watchlist);
  const selected = useScannerStore((s) => s.selected);
  const interval = useScannerStore((s) => s.interval);
  const scanning = useScannerStore((s) => s.scanning);
  const rules = useScannerStore((s) => s.rules);
  const signals = useScannerStore((s) => s.signals);
  const select = useScannerStore((s) => s.select);
  const addSymbol = useScannerStore((s) => s.addSymbol);
  const removeSymbol = useScannerStore((s) => s.removeSymbol);
  const setIntervalTf = useScannerStore((s) => s.setInterval);
  const setScanning = useScannerStore((s) => s.setScanning);
  const setRules = useScannerStore((s) => s.setRules);
  const pushSignal = useScannerStore((s) => s.pushSignal);
  const clearSignals = useScannerStore((s) => s.clearSignals);

  const [rows, setRows] = useState<Record<string, SymbolScan>>({});
  const [chart, setChart] = useState<Candle[]>([]);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<"watch" | "chart" | "rules" | "signals">("chart");
  const inFlight = useRef(false);
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  useEffect(() => {
    let cancelled = false;
    loadKlines(selected, interval)
      .then((c) => {
        if (!cancelled) setChart(c);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Chart failed");
      });
    return () => {
      cancelled = true;
    };
  }, [selected, interval]);

  useEffect(() => {
    if (!scanning) {
      setStatus("Paused");
      return;
    }
    let cancelled = false;
    inFlight.current = false;

    async function tick() {
      if (cancelled || inFlight.current) return;
      inFlight.current = true;
      const state = useScannerStore.getState();
      setStatus("Scanning…");
      setError(null);
      try {
        const tickers = await loadTickers(state.watchlist);
        if (cancelled) return;
        const tickerMap = Object.fromEntries(tickers.map((t) => [t.symbol, t]));
        const next: Record<string, SymbolScan> = {};
        for (const symbol of state.watchlist) {
          next[symbol] = {
            symbol,
            ticker: tickerMap[symbol] ?? null,
            eval: null,
            error: null,
            updatedAt: Date.now(),
          };
        }
        setRows({ ...next });
        setStatus(`Live prices · ${state.watchlist.length} pairs · fetching ${state.interval} charts`);

        await mapPool(state.watchlist, 3, async (symbol) => {
          let candles: Candle[] = [];
          let klineError: string | null = null;
          try {
            candles = await loadKlines(symbol, state.interval);
          } catch (err) {
            klineError = err instanceof Error ? err.message : "klines failed";
          }
          if (cancelled) return;
          const ticker = tickerMap[symbol] ?? next[symbol]?.ticker ?? null;
          const ev = candles.length
            ? evaluateSetup(candles, rulesRef.current, ticker?.changePct ?? null)
            : null;
          next[symbol] = {
            symbol,
            ticker,
            eval: ev,
            error: klineError,
            updatedAt: Date.now(),
          };
          setRows({ ...next });
          if (symbol === state.selected && candles.length) setChart(candles);
          if (ev?.matched) {
            const added = pushSignal({
              id: `${symbol}-${ev.fingerprint}`,
              symbol,
              interval: state.interval,
              at: Date.now(),
              price: ev.price,
              candleOpenTime: ev.candleOpenTime,
              fingerprint: ev.fingerprint,
              reasons: ev.reasons,
            });
            if (added) {
              toast(`${symbol} buy setup`, { description: ev.reasons.join(" · ") });
            }
          }
        });
        if (cancelled) return;
        const hits = Object.values(next).filter((r) => r.eval?.matched).length;
        setStatus(`Live · ${state.watchlist.length} pairs · ${hits} match${hits === 1 ? "" : "es"}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed");
        setStatus("Retrying");
      } finally {
        inFlight.current = false;
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), SCAN_MS[interval]);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [scanning, interval, watchlist.join("|"), pushSignal]);

  const selectedRow = rows[selected];
  const markTime = signals.find((s) => s.symbol === selected)?.candleOpenTime ?? null;

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const symbol = normalizeSymbol(addValue.endsWith("USDT") ? addValue : `${addValue}USDT`);
    if (!isUsdtSymbol(symbol)) {
      setError("Use a USDT pair such as BTC or BTCUSDT.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await loadTicker(symbol);
      if (!addSymbol(symbol)) setError("Already on the list or list is full.");
      setAddValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Symbol not found on Binance");
    } finally {
      setAdding(false);
    }
  }

  const unusedSuggested = useMemo(
    () => SUGGESTED_SYMBOLS.filter((s) => !watchlist.includes(s)),
    [watchlist],
  );

  return (
    <div
      data-scanner-app=""
      className="mx-auto flex min-h-dvh max-w-[1400px] flex-col bg-bg text-fg shadow-[0_0_0_1px_var(--color-line)]"
    >
      <Toaster richColors position="top-center" />
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">Mechanics Helper</p>
          <h1 className="text-lg font-semibold tracking-tight">Chart scanner</h1>
          <p className="text-sm text-muted">
            {SETUP_NAME} buy setup · alerts only — never places trades. Binance public data, no API key.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Timeframe"
            data-interval=""
            className="h-10 rounded-[10px] border border-line bg-surface px-3 font-mono text-sm"
            value={interval}
            onChange={(e) => setIntervalTf(e.target.value as Interval)}
          >
            {INTERVALS.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
          <button
            type="button"
            data-scan-toggle=""
            className="tap inline-flex h-10 items-center gap-2 rounded-[10px] bg-accent px-3.5 text-sm font-semibold text-ink"
            onClick={() => setScanning(!scanning)}
          >
            {scanning ? <Pause className="size-4" /> : <Play className="size-4" />}
            {scanning ? "Pause" : "Scan"}
          </button>
          <ThemeToggle compact />
          <LanguageToggle compact />
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold"
          >
            Back to shop
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 text-sm">
        <p className="font-mono text-muted" data-scan-status="">
          {status}
        </p>
        {error ? (
          <p className="text-danger" data-scan-error="">
            {error}
          </p>
        ) : (
          <p className="text-muted">Source: Binance spot · USDT</p>
        )}
      </div>

      <nav className="grid grid-cols-4 border-b border-line lg:hidden">
        {(["watch", "chart", "rules", "signals"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-11 text-sm font-semibold capitalize ${tab === id ? "text-accent" : "text-muted"}`}
          >
            {id}
          </button>
        ))}
      </nav>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <section className={`${tab === "watch" ? "block" : "hidden"} border-r border-line lg:block`}>
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Watchlist</h2>
            <span className="font-mono text-[11px] text-dim">{watchlist.length}</span>
          </div>
          <form onSubmit={onAdd} className="flex gap-2 px-3 pb-2">
            <input
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              placeholder="Add BTC or ETHUSDT"
              aria-label="Add symbol"
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              disabled={adding}
              className="tap grid size-10 place-items-center rounded-[10px] border border-line bg-surface2"
              aria-label="Add to watchlist"
            >
              <Plus className="size-4" />
            </button>
          </form>
          {unusedSuggested.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {unusedSuggested.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-line px-2 py-1 font-mono text-[11px] text-muted"
                  onClick={() => void loadTicker(s).then(() => addSymbol(s)).catch((err: unknown) => setError(err instanceof Error ? err.message : "Add failed"))}
                >
                  {s.replace("USDT", "")}
                </button>
              ))}
            </div>
          ) : null}
          <ul className="max-h-[calc(100dvh-220px)] overflow-y-auto">
            {watchlist.map((symbol) => {
              const row = rows[symbol];
              const change = row?.ticker?.changePct;
              const matched = Boolean(row?.eval?.matched);
              return (
                <li key={symbol} className="border-t border-line">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      data-symbol={symbol}
                      onClick={() => {
                        select(symbol);
                        setTab("chart");
                      }}
                      className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left ${selected === symbol ? "bg-surface2" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{symbol.replace("USDT", "")}</span>
                          {matched ? (
                            <span className="rounded-full bg-good/15 px-1.5 py-0.5 font-mono text-[10px] text-good">
                              MATCH
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex gap-2 font-mono text-[11px] text-muted">
                          <span>{row?.ticker ? fmtPrice(row.ticker.lastPrice) : "…"}</span>
                          <span className={change != null && change >= 0 ? "text-good" : "text-down"}>
                            {change == null ? "" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
                          </span>
                        </div>
                        {row?.eval ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {row.eval.conditions.map((c) => (
                              <span
                                key={c.id}
                                className={`rounded px-1 py-0.5 font-mono text-[10px] ${c.passed ? "bg-good/12 text-good" : "bg-surface text-dim"}`}
                              >
                                {c.id === "nearMa"
                                  ? `21 ${c.detail}`
                                  : c.id === "vsSma"
                                    ? `200 ${c.passed ? "↑" : "↓"}`
                                    : c.id === "stochRsi"
                                      ? `SRSI ${c.detail}`
                                      : c.id === "rsi"
                                        ? `RSI ${c.detail}`
                                        : c.id === "volumeSpike"
                                          ? `Vol ${c.detail}`
                                          : c.id === "emaCross"
                                            ? "EMA"
                                            : "24h"}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="grid w-10 place-items-center text-dim hover:text-danger"
                      aria-label={`Remove ${symbol}`}
                      onClick={() => removeSymbol(symbol)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${tab === "chart" ? "flex" : "hidden"} min-h-[320px] flex-col lg:flex`}>
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line px-4 py-3">
            <div>
              <h2 className="font-mono text-xl font-semibold">{selected.replace("USDT", "")}<span className="text-sm text-muted">/USDT</span></h2>
              <p className="font-mono text-sm text-muted">
                {selectedRow?.ticker ? `${fmtPrice(selectedRow.ticker.lastPrice)} · ${interval}` : interval}
              </p>
            </div>
            {selectedRow?.eval?.matched ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-good/15 px-2.5 py-1 font-mono text-xs text-good">
                <Activity className="size-3.5" /> Buy setup
              </p>
            ) : null}
          </div>
          <div className="min-h-[280px] flex-1 p-2">
            <ScannerChart candles={chart} markTime={markTime} />
          </div>
        </section>

        <section className={`${tab === "rules" || tab === "signals" ? "block" : "hidden"} border-l border-line lg:block`}>
          <div className="border-b border-line p-3">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Buy setup</h2>
            <p className="mt-1 text-sm text-muted" data-setup-name="">
              {SETUP_NAME}: get in on the 21 SMA, in an uptrend above the 200, with a StochRSI reset. Conditions are AND. Extra filters stay off unless you turn them on.
            </p>
            <RuleToggles />
            <button
              type="button"
              data-reset-rules=""
              className="mt-3 text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
              onClick={() => {
                setRules(() => ({ ...DEFAULT_RULES }));
                setIntervalTf(DEFAULT_INTERVAL);
              }}
            >
              Reset Crypto Lifers defaults
            </button>
          </div>
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                <Bell className="size-3.5" /> Signals
              </h2>
              <button type="button" className="text-xs font-semibold text-muted" onClick={clearSignals}>
                Clear
              </button>
            </div>
            {signals.length === 0 ? (
              <p className="text-sm text-muted" data-signals-empty="">
                No alerts yet. Leave Scan on — matches toast and land here. Nothing is sent to an exchange.
              </p>
            ) : (
              <ol className="flex max-h-[42dvh] flex-col gap-2 overflow-y-auto" data-signals-list="">
                {signals.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-left"
                      onClick={() => {
                        select(s.symbol);
                        setTab("chart");
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold">{s.symbol.replace("USDT", "")}</span>
                        <span className="font-mono text-[11px] text-muted">{fmtPrice(s.price)}</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-snug text-muted">{s.reasons.join(" · ")}</p>
                      <p className="mt-1 font-mono text-[10px] text-dim">
                        {s.interval} · {new Date(s.at).toLocaleTimeString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RuleToggles() {
  const rules = useScannerStore((s) => s.rules);
  const setRules = useScannerStore((s) => s.setRules);

  return (
    <div className="mt-3 flex flex-col gap-2" data-buy-rules="">
      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          data-near-ma=""
          checked={rules.nearMa.enabled}
          onChange={(e) => setRules({ nearMa: { ...rules.nearMa, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">On / near SMA 21</span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            SMA
            <input
              type="number"
              className="h-8 w-14 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.nearMa.period}
              min={5}
              max={50}
              onChange={(e) => setRules({ nearMa: { ...rules.nearMa, period: num(e.target.value, 21) } })}
            />
            within
            <input
              type="number"
              step="0.1"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              data-near-pct=""
              value={rules.nearMa.maxPct}
              min={0.2}
              max={10}
              onChange={(e) => setRules({ nearMa: { ...rules.nearMa, maxPct: num(e.target.value, 2.5) } })}
            />
            %
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          checked={rules.vsSma.enabled}
          onChange={(e) => setRules({ vsSma: { ...rules.vsSma, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Uptrend vs SMA 200</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            Close
            <select
              className="h-8 rounded-md border border-line bg-bg px-1.5"
              value={rules.vsSma.side}
              onChange={(e) =>
                setRules({ vsSma: { ...rules.vsSma, side: e.target.value as "above" | "below" } })
              }
            >
              <option value="above">above</option>
              <option value="below">below</option>
            </select>
            SMA
            <input
              type="number"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.vsSma.period}
              min={20}
              max={250}
              onChange={(e) => setRules({ vsSma: { ...rules.vsSma, period: num(e.target.value, 200) } })}
            />
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          data-stoch-rsi=""
          checked={rules.stochRsi.enabled}
          onChange={(e) => setRules({ stochRsi: { ...rules.stochRsi, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">StochRSI reset</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            %K ≤
            <input
              type="number"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              data-stoch-max=""
              value={rules.stochRsi.max}
              min={5}
              max={80}
              onChange={(e) => setRules({ stochRsi: { ...rules.stochRsi, max: num(e.target.value, 30) } })}
            />
            (14,14,3,3)
          </span>
        </span>
      </label>

      <p className="pt-1 text-[11px] font-semibold tracking-[0.14em] text-dim uppercase">Extra filters</p>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          checked={rules.rsi.enabled}
          onChange={(e) => setRules({ rsi: { ...rules.rsi, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">RSI oversold</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            RSI
            <input
              type="number"
              className="h-8 w-14 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.rsi.period}
              min={2}
              max={50}
              onChange={(e) => setRules({ rsi: { ...rules.rsi, period: num(e.target.value, 14) } })}
            />
            &lt;
            <input
              type="number"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              data-rsi-max=""
              value={rules.rsi.max}
              min={1}
              max={99}
              onChange={(e) => setRules({ rsi: { ...rules.rsi, max: num(e.target.value, 35) } })}
            />
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          checked={rules.emaCross.enabled}
          onChange={(e) => setRules({ emaCross: { ...rules.emaCross, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">EMA crossover</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            Fast
            <input
              type="number"
              className="h-8 w-14 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.emaCross.fast}
              min={2}
              max={50}
              onChange={(e) => setRules({ emaCross: { ...rules.emaCross, fast: num(e.target.value, 9) } })}
            />
            Slow
            <input
              type="number"
              className="h-8 w-14 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.emaCross.slow}
              min={3}
              max={100}
              onChange={(e) => setRules({ emaCross: { ...rules.emaCross, slow: num(e.target.value, 21) } })}
            />
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          checked={rules.volumeSpike.enabled}
          onChange={(e) => setRules({ volumeSpike: { ...rules.volumeSpike, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Volume spike</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            ≥
            <input
              type="number"
              step="0.1"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.volumeSpike.multiplier}
              min={1}
              max={10}
              onChange={(e) =>
                setRules({ volumeSpike: { ...rules.volumeSpike, multiplier: num(e.target.value, 1.6) } })
              }
            />
            × SMA
            <input
              type="number"
              className="h-8 w-14 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.volumeSpike.period}
              min={5}
              max={50}
              onChange={(e) =>
                setRules({ volumeSpike: { ...rules.volumeSpike, period: num(e.target.value, 20) } })
              }
            />
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface p-2.5">
        <input
          type="checkbox"
          className="mt-1"
          checked={rules.pullback.enabled}
          onChange={(e) => setRules({ pullback: { ...rules.pullback, enabled: e.target.checked } })}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">24h pullback %</span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            Change ≤
            <input
              type="number"
              step="0.5"
              className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
              value={rules.pullback.maxChangePct}
              min={-50}
              max={0}
              onChange={(e) =>
                setRules({ pullback: { ...rules.pullback, maxChangePct: num(e.target.value, -3) } })
              }
            />
            %
          </span>
        </span>
      </label>
    </div>
  );
}

function num(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await fn(items[index]!);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}
