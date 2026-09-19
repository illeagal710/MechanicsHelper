import { useEffect, useState } from "react";
import { CHECKLIST_PERSIST_KEY, HUNT_FILTER, PRETRADE_CHECKS, VRVP_SETTINGS } from "@/lib/scanner/defaults";

function loadTicks(): boolean[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_PERSIST_KEY);
    if (!raw) return PRETRADE_CHECKS.map(() => false);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== PRETRADE_CHECKS.length) {
      return PRETRADE_CHECKS.map(() => false);
    }
    return parsed.map((v) => Boolean(v));
  } catch {
    return PRETRADE_CHECKS.map(() => false);
  }
}

export function ScannerChecklist() {
  const [ticks, setTicks] = useState<boolean[]>(() => PRETRADE_CHECKS.map(() => false));

  useEffect(() => {
    setTicks(loadTicks());
  }, []);

  function toggle(index: number) {
    setTicks((prev) => {
      const next = prev.map((v, i) => (i === index ? !v : v));
      localStorage.setItem(CHECKLIST_PERSIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clear() {
    const next = PRETRADE_CHECKS.map(() => false);
    localStorage.setItem(CHECKLIST_PERSIST_KEY, JSON.stringify(next));
    setTicks(next);
  }

  const done = ticks.filter(Boolean).length;

  return (
    <div className="border-b border-line p-3" data-pretrade-checklist="">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          Pre-Trade Check List
        </h2>
        <span className="font-mono text-[11px] text-dim" data-checklist-progress="">
          {done}/{PRETRADE_CHECKS.length}
        </span>
      </div>
      <p className="text-sm text-muted">
        Official Crypto Lifer card. Tick these before acting on a long alert. Alerts only — this
        does not place an order.
      </p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {PRETRADE_CHECKS.map((item, index) => (
          <li key={item}>
            <label className="flex items-start gap-2 rounded-[10px] border border-line bg-surface px-2.5 py-2">
              <input
                type="checkbox"
                className="mt-1"
                data-checklist-item={index + 1}
                checked={Boolean(ticks[index])}
                onChange={() => toggle(index)}
              />
              <span className="text-sm">
                <span className="font-mono text-[11px] text-dim">{index + 1}.</span> {item}
              </span>
            </label>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline"
        data-checklist-clear=""
        onClick={clear}
      >
        Clear ticks
      </button>
      <p className="mt-3 text-xs text-muted" data-hunt-filter="">
        {HUNT_FILTER}
      </p>
      <p className="mt-2 text-xs text-muted" data-vrvp-note="">
        VRVP on {VRVP_SETTINGS.timeframe} ({VRVP_SETTINGS.name}): row size {VRVP_SETTINGS.rowSize},
        volume {VRVP_SETTINGS.volume}, value area {VRVP_SETTINGS.valueArea}%. {VRVP_SETTINGS.rule}{" "}
        Not an auto alert.
      </p>
    </div>
  );
}
