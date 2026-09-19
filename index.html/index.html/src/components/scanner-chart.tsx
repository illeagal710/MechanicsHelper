import { useEffect, useMemo, useRef, useState } from "react";
import { ema } from "@/lib/scanner/indicators";
import type { Candle } from "@/lib/scanner/types";

type Point = Candle & { emaFast: number | null; emaSlow: number | null };

export function ScannerChart({
  candles,
  fast = 9,
  slow = 21,
  markTime,
}: {
  candles: Candle[];
  fast?: number;
  slow?: number;
  markTime?: number | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      setSize({ w: Math.max(240, box.width), h: Math.max(220, box.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data: Point[] = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const fasts = ema(closes, fast);
    const slows = ema(closes, slow);
    return candles.map((c, i) => ({ ...c, emaFast: fasts[i], emaSlow: slows[i] }));
  }, [candles, fast, slow]);

  const slice = data.slice(-120);
  if (slice.length === 0) {
    return (
      <div ref={wrapRef} className="relative h-full min-h-[240px] w-full" data-scanner-chart="">
        <div className="absolute inset-0 grid place-items-center text-sm text-muted">Waiting for candles</div>
      </div>
    );
  }
  const w = size.w;
  const h = size.h;
  const volH = Math.max(48, Math.round(h * 0.22));
  const pad = { l: 8, r: 8, t: 12, b: 8, mid: 10 };
  const plotH = h - volH - pad.t - pad.b - pad.mid;
  const plotW = w - pad.l - pad.r;
  const n = slice.length || 1;
  const highs = slice.map((c) => c.high);
  const lows = slice.map((c) => c.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const volMax = Math.max(...slice.map((c) => c.volume), 1);
  const slot = plotW / n;
  const y = (price: number) => pad.t + ((max - price) / span) * plotH;
  const x = (i: number) => pad.l + slot * i + slot / 2;
  const hi = hover != null && hover >= 0 && hover < slice.length ? hover : slice.length - 1;
  const bar = slice[hi];

  const emaFastPath = pathFor(
    slice.map((c, i) => (c.emaFast == null ? null : [x(i), y(c.emaFast)] as const)),
  );
  const emaSlowPath = pathFor(
    slice.map((c, i) => (c.emaSlow == null ? null : [x(i), y(c.emaSlow)] as const)),
  );

  return (
    <div ref={wrapRef} className="relative h-full min-h-[240px] w-full" data-scanner-chart="">
      <svg
        width={w}
        height={h}
        className="block h-full w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = e.clientX - rect.left - pad.l;
          const i = Math.min(n - 1, Math.max(0, Math.floor(px / slot)));
          setHover(i);
        }}
      >
        {slice.map((c, i) => {
          const cx = x(i);
          const up = c.close >= c.open;
          const color = up ? "var(--color-good)" : "var(--color-down)";
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyBot = y(Math.min(c.open, c.close));
          const bw = Math.max(1.5, Math.min(9, slot * 0.62));
          const marked = markTime != null && c.openTime === markTime;
          return (
            <g key={c.openTime}>
              {marked ? (
                <rect
                  x={cx - slot / 2}
                  y={pad.t}
                  width={slot}
                  height={plotH}
                  fill="var(--color-accent)"
                  opacity={0.12}
                />
              ) : null}
              <line
                x1={cx}
                x2={cx}
                y1={y(c.high)}
                y2={y(c.low)}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                x={cx - bw / 2}
                y={bodyTop}
                width={bw}
                height={Math.max(1, bodyBot - bodyTop)}
                fill={color}
              />
              <rect
                x={cx - slot / 2 + 1}
                y={h - pad.b - volH + (1 - c.volume / volMax) * volH}
                width={Math.max(1, slot - 2)}
                height={Math.max(1, (c.volume / volMax) * volH)}
                fill={color}
                opacity={0.45}
              />
            </g>
          );
        })}
        {emaSlowPath ? (
          <path d={emaSlowPath} fill="none" stroke="var(--color-muted)" strokeWidth={1.25} />
        ) : null}
        {emaFastPath ? (
          <path d={emaFastPath} fill="none" stroke="var(--color-accent)" strokeWidth={1.4} />
        ) : null}
        {bar ? (
          <line
            x1={x(hi)}
            x2={x(hi)}
            y1={pad.t}
            y2={h - pad.b}
            stroke="var(--color-line)"
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>
      {bar ? (
        <div className="pointer-events-none absolute left-2 top-1 font-mono text-[11px] leading-4 text-muted">
          <span className="text-fg">{fmt(bar.close)}</span>
          <span className="ml-2">O {fmt(bar.open)}</span>
          <span className="ml-2">H {fmt(bar.high)}</span>
          <span className="ml-2">L {fmt(bar.low)}</span>
          <span className="ml-2">V {fmt(bar.volume, 0)}</span>
          {bar.emaFast != null ? <span className="ml-2 text-accent">EMA{fast} {fmt(bar.emaFast)}</span> : null}
          {bar.emaSlow != null ? <span className="ml-2">EMA{slow} {fmt(bar.emaSlow)}</span> : null}
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted">No candles yet</div>
      )}
    </div>
  );
}

function pathFor(points: (readonly [number, number] | null)[]): string | null {
  let d = "";
  let started = false;
  for (const p of points) {
    if (!p) {
      started = false;
      continue;
    }
    d += started ? ` L ${p[0]} ${p[1]}` : `M ${p[0]} ${p[1]}`;
    started = true;
  }
  return d || null;
}

function fmt(value: number, digits?: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const d = digits ?? (abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6);
  return value.toLocaleString("en-US", { maximumFractionDigits: d });
}
