import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { weexAccount, weexDepositNetworks } from "@/lib/scanner/weex-api";
import { clearLocalCreds, loadLocalCreds, maskKey, saveLocalCreds } from "@/lib/scanner/weex-creds";
import { armLive, executeLifersEntry, tripKillSwitch } from "@/lib/scanner/weex-exec";
import { useWeexStore } from "@/lib/scanner/weex-store";
import { fmtPrice } from "@/lib/scanner/indicators";
import { WEEX_API_KEYS_URL, WEEX_DEPOSIT_URL, type ExecutionMode, type WeexAccountView, type WeexNetwork } from "@/lib/scanner/weex-trade";

export function WeexPanel({
  selected,
  lastPrice,
  watchlist,
}: {
  selected: string;
  lastPrice: number | null;
  watchlist: string[];
}) {
  const execution = useWeexStore((s) => s.execution);
  const liveArmed = useWeexStore((s) => s.liveArmed);
  const killed = useWeexStore((s) => s.killed);
  const connected = useWeexStore((s) => s.connected);
  const sizePct = useWeexStore((s) => s.sizePct);
  const maxQuote = useWeexStore((s) => s.maxQuote);
  const minQuote = useWeexStore((s) => s.minQuote);
  const paperUsdt = useWeexStore((s) => s.paperUsdt);
  const fills = useWeexStore((s) => s.fills);
  const setExecution = useWeexStore((s) => s.setExecution);
  const setKilled = useWeexStore((s) => s.setKilled);
  const setConnected = useWeexStore((s) => s.setConnected);
  const setSizing = useWeexStore((s) => s.setSizing);
  const clearFills = useWeexStore((s) => s.clearFills);

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [acct, setAcct] = useState<WeexAccountView | null>(null);
  const [networks, setNetworks] = useState<WeexNetwork[]>([]);
  const [netError, setNetError] = useState<string | null>(null);
  const [masked, setMasked] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadLocalCreds();
    if (saved) setMasked(maskKey(saved.apiKey));
    void weexDepositNetworks()
      .then((rows) => {
        setNetworks(rows);
        setNetError(null);
      })
      .catch((err: unknown) => setNetError(err instanceof Error ? err.message : "Deposit networks unavailable"));
  }, []);

  useEffect(() => {
    const saved = loadLocalCreds();
    if (!saved) return;
    let cancelled = false;
    void weexAccount({ data: { source: "session", creds: saved } })
      .then((view) => {
        if (cancelled) return;
        setAcct(view);
        setConnected(true);
        setMasked(maskKey(saved.apiKey));
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setConnected]);

  async function onConnect(e: FormEvent) {
    e.preventDefault();
    const creds = {
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      passphrase: passphrase.trim(),
    };
    if (!creds.apiKey || !creds.apiSecret || !creds.passphrase) {
      toast.error("Enter API key, secret, and passphrase from WEEX → API Management");
      return;
    }
    setBusy(true);
    try {
      const view = await weexAccount({ data: { source: "session", creds } });
      saveLocalCreds(creds);
      setAcct(view);
      setConnected(true);
      setMasked(maskKey(creds.apiKey));
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      toast.success("WEEX connected on this machine only");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "WEEX connect failed");
    } finally {
      setBusy(false);
    }
  }

  function onDisconnect() {
    clearLocalCreds();
    setAcct(null);
    setConnected(false);
    setMasked(null);
    useWeexStore.getState().setLiveArmed(false);
    toast.message("Cleared local WEEX keys");
  }

  async function onKill() {
    const result = await tripKillSwitch(watchlist);
    toast.error(
      result.cancelled
        ? `Kill switch on · cancelled ${result.cancelled} open order(s)`
        : "Kill switch on · no further orders",
    );
  }

  async function onArm() {
    try {
      await armLive(!liveArmed);
      toast(liveArmed ? "Live disarmed — paper/alerts only" : "Live armed — Lifers matches will send WEEX market buys");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Arm failed");
    }
  }

  async function onPaperFill() {
    if (!lastPrice) {
      toast.error("Wait for a last price on the selected pair");
      return;
    }
    const fill = await executeLifersEntry({
      symbol: selected,
      price: lastPrice,
      candleOpenTime: Date.now(),
      reasons: ["Manual paper fill"],
      source: "manual-paper",
      watchlist,
    });
    if (fill?.status === "simulated") toast.success(`Paper fill ${selected} ${fmtPrice(fill.quote)} USDT`);
    else toast.message(fill?.error || fill?.status || "No fill");
  }

  const modes: ExecutionMode[] = ["alerts", "paper", "live"];

  return (
    <div className="border-b border-line p-3" data-weex-panel="">
      <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">WEEX trading</h2>
      <p className="mt-1 text-sm text-muted">
        Official WEEX REST only. Keys stay in this browser on your machine — not git, not the project store.
        Default is paper. Live does nothing until you arm it.
      </p>

      <div className="mt-2 grid grid-cols-3 gap-1" data-weex-mode="">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            data-weex-mode-btn={mode}
            className={`h-9 rounded-md text-xs font-semibold capitalize ${
              execution === mode ? "bg-accent text-ink" : "border border-line bg-surface text-muted"
            }`}
            onClick={() => setExecution(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <p className="mt-1 font-mono text-[11px] text-dim" data-weex-gate="">
        {killed
          ? "Kill switch ON"
          : execution === "live"
            ? liveArmed
              ? "Live ARMED"
              : "Live selected · not armed"
            : execution === "paper"
              ? "Paper / dry-run"
              : "Alerts only"}
      </p>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          data-weex-arm=""
          disabled={execution !== "live" || killed}
          className="tap h-10 flex-1 rounded-[10px] border border-line bg-surface text-sm font-semibold disabled:opacity-40"
          onClick={() => void onArm()}
        >
          {liveArmed ? "Disarm live" : "Arm live"}
        </button>
        <button
          type="button"
          data-weex-kill=""
          className="tap h-10 flex-1 rounded-[10px] bg-danger px-2 text-sm font-semibold text-white"
          onClick={() => void onKill()}
        >
          Kill switch
        </button>
      </div>
      {killed ? (
        <button type="button" className="mt-2 text-xs font-semibold text-muted underline" onClick={() => setKilled(false)}>
          Clear kill switch
        </button>
      ) : null}

      {masked ? (
        <div className="mt-3 rounded-[10px] border border-line bg-surface p-2.5 text-sm">
          <p className="font-mono text-xs text-muted">Connected {masked}</p>
          {acct ? (
            <p className="mt-1 font-mono text-sm" data-weex-usdt="">
              USDT {fmtPrice(acct.usdtFree)} free
              {acct.usdtLocked ? ` · ${fmtPrice(acct.usdtLocked)} locked` : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">Balances load after a successful connect.</p>
          )}
          <p className="mt-1 text-[11px] text-dim">
            Deposits {acct?.canDeposit === false ? "disabled" : "enabled"} · fund on WEEX, then refresh connect.
          </p>
          <button type="button" className="mt-2 text-xs font-semibold text-danger" onClick={onDisconnect}>
            Disconnect and erase local keys
          </button>
        </div>
      ) : (
        <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => void onConnect(e)} data-weex-connect="">
          <input
            className="h-9 rounded-md border border-line bg-bg px-2 font-mono text-xs"
            placeholder="API key"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <input
            className="h-9 rounded-md border border-line bg-bg px-2 font-mono text-xs"
            placeholder="API secret"
            type="password"
            autoComplete="off"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
          <input
            className="h-9 rounded-md border border-line bg-bg px-2 font-mono text-xs"
            placeholder="Passphrase"
            type="password"
            autoComplete="off"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="tap h-10 rounded-[10px] border border-line bg-surface text-sm font-semibold"
          >
            {busy ? "Connecting…" : "Save on this machine"}
          </button>
          <a className="text-[11px] text-muted underline" href={WEEX_API_KEYS_URL} target="_blank" rel="noreferrer">
            Create a key at WEEX API Management
          </a>
        </form>
      )}

      <div className="mt-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-dim uppercase">Fund / deposit</p>
        <p className="mt-1 text-xs text-muted">
          WEEX does not expose deposit addresses on the API. Use the official deposit page. Networks below are public
          config.
        </p>
        <a className="mt-1 inline-block text-xs font-semibold text-accent underline" href={WEEX_DEPOSIT_URL} target="_blank" rel="noreferrer">
          Open WEEX deposit
        </a>
        {netError ? <p className="mt-1 text-xs text-danger">{netError}</p> : null}
        <ul className="mt-1 max-h-24 overflow-y-auto font-mono text-[11px] text-muted" data-weex-networks="">
          {networks.slice(0, 8).map((n) => (
            <li key={n.network}>
              {n.name || n.network}
              {n.isDefault ? " · default" : ""} · {n.depositEnable ? "open" : "closed"}
              {n.depositDust ? ` · min ${n.depositDust}` : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-dim uppercase">Position size</p>
        <label className="mt-1 flex items-center gap-2 text-xs text-muted">
          {sizePct}% of USDT
          <input
            type="number"
            className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
            min={1}
            max={100}
            value={sizePct}
            onChange={(e) => setSizing({ sizePct: Number(e.target.value) || 5 })}
          />
        </label>
        <label className="mt-1 flex items-center gap-2 text-xs text-muted">
          max
          <input
            type="number"
            className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
            min={5}
            value={maxQuote}
            onChange={(e) => setSizing({ maxQuote: Number(e.target.value) || 50 })}
          />
          min
          <input
            type="number"
            className="h-8 w-16 rounded-md border border-line bg-bg px-1.5 font-mono"
            min={1}
            value={minQuote}
            onChange={(e) => setSizing({ minQuote: Number(e.target.value) || 10 })}
          />
          USDT
        </label>
        {!connected ? (
          <p className="mt-1 text-[11px] text-dim">Paper sizes against {fmtPrice(paperUsdt)} virtual USDT until you connect.</p>
        ) : null}
        <button
          type="button"
          data-weex-paper-fill=""
          className="tap mt-2 h-9 w-full rounded-[10px] border border-line bg-surface text-xs font-semibold"
          onClick={() => void onPaperFill()}
        >
          Paper-fill {selected.replace("USDT", "")}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-dim uppercase">Fills</p>
          <button type="button" className="text-[11px] font-semibold text-muted" onClick={clearFills}>
            Clear
          </button>
        </div>
        {fills.length === 0 ? (
          <p className="mt-1 text-xs text-muted" data-weex-fills-empty="">
            No fills yet. Paper logs simulations. Live logs WEEX order ids after Arm.
          </p>
        ) : (
          <ol className="mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto" data-weex-fills="">
            {fills.map((f) => (
              <li key={f.id} className="rounded-md border border-line bg-surface px-2 py-1">
                <p className="font-mono text-[11px]">
                  {f.symbol.replace("USDT", "")} {f.mode} · {f.status}
                </p>
                <p className="font-mono text-[10px] text-muted">
                  {f.quantity ? `${f.quantity} @ ${fmtPrice(f.price)}` : f.error || f.reason}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
