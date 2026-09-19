import { useEffect, useMemo, useRef, useState } from "react";
import { LIFER_FILL, LIFER_MA_COLORS } from "@/lib/scanner/defaults";
import { sma } from "@/lib/scanner/indicators";
import type { Candle } from "@/lib/scanner/types";

type Point = Candle & {
  sma21: number | null;
  sma50: number | null;
  sma80: number | null;
  sma100: number | null;
  sma200: number | null;
};

const W = 2;

export function ScannerChart({
  candles,
  markTime,
}: {
  candles: Candle[];
  markTime?: number | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [hover, setHover] = useState<number | null>(null);
  const [fillOn, setFillOn] = useState(true);

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
    const s21 = sma(closes, 21);
    const s50 = sma(closes, 50);
    const s80 = sma(closes, 80);
    const s100 = sma(closes, 100);
    const s200 = sma(closes, 200);
    return candles.map((c, i) => ({
      ...c,
      sma21: s21[i],
      sma50: s50[i],
      sma80: s80[i],
      sma100: s100[i],
      sma200: s200[i],
    }));
  }, [candles]);

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
  const pad = { l: 8, r: 8, t: 28, b: 8, mid: 10 };
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

  const pts21 = slice.map((c, i) => (c.sma21 == null ? null : ([x(i), y(c.sma21)] as const)));
  const pts50 = slice.map((c, i) => (c.sma50 == null ? null : ([x(i), y(c.sma50)] as const)));
  const pts80 = slice.map((c, i) => (c.sma80 == null ? null : ([x(i), y(c.sma80)] as const)));
  const pts100 = slice.map((c, i) => (c.sma100 == null ? null : ([x(i), y(c.sma100)] as const)));
  const pts200 = slice.map((c, i) => (c.sma200 == null ? null : ([x(i), y(c.sma200)] as const)));
  const sma21Path = pathFor(pts21);
  const sma50Path = pathFor(pts50);
  const sma80Path = pathFor(pts80);
  const sma100Path = pathFor(pts100);
  const sma200Path = pathFor(pts200);
  const fillPath = fillOn ? areaBetween(pts21, pts200) : null;

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
              <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
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
        {fillPath ? <path d={fillPath} fill={LIFER_FILL} data-lifer-fill="" /> : null}
        {sma21Path ? (
          <path d={sma21Path} fill="none" stroke={LIFER_MA_COLORS[21]} strokeWidth={W} data-sma21="" />
        ) : null}
        {sma50Path ? (
          <path d={sma50Path} fill="none" stroke={LIFER_MA_COLORS[50]} strokeWidth={W} data-sma50="" />
        ) : null}
        {sma80Path ? (
          <path d={sma80Path} fill="none" stroke={LIFER_MA_COLORS[80]} strokeWidth={W} data-sma80="" />
        ) : null}
        {sma100Path ? (
          <path d={sma100Path} fill="none" stroke={LIFER_MA_COLORS[100]} strokeWidth={W} data-sma100="" />
        ) : null}
        {sma200Path ? (
          <path d={sma200Path} fill="none" stroke={LIFER_MA_COLORS[200]} strokeWidth={W} data-sma200="" />
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
          {bar.sma21 != null ? (
            <span className="ml-2" style={{ color: LIFER_MA_COLORS[21] }}>
              21 {fmt(bar.sma21)}
            </span>
          ) : null}
          {bar.sma50 != null ? (
            <span className="ml-2" style={{ color: LIFER_MA_COLORS[50] }}>
              50 {fmt(bar.sma50)}
            </span>
          ) : null}
          {bar.sma80 != null ? (
            <span className="ml-2" style={{ color: LIFER_MA_COLORS[80] }}>
              80 {fmt(bar.sma80)}
            </span>
          ) : null}
          {bar.sma100 != null ? (
            <span className="ml-2" style={{ color: LIFER_MA_COLORS[100] }}>
              100 {fmt(bar.sma100)}
            </span>
          ) : null}
          {bar.sma200 != null ? (
            <span className="ml-2" style={{ color: LIFER_MA_COLORS[200] }}>
              200 {fmt(bar.sma200)}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted">No candles yet</div>
      )}
      <div
        className="pointer-events-none absolute right-2 bottom-14 flex flex-wrap justify-end gap-x-2 gap-y-0.5 font-mono text-[10px]"
        data-sma-legend=""
      >
        <span style={{ color: LIFER_MA_COLORS[21] }}>21 white</span>
        <span style={{ color: LIFER_MA_COLORS[50] }}>50 red</span>
        <span style={{ color: LIFER_MA_COLORS[80] }}>80 purple</span>
        <span style={{ color: LIFER_MA_COLORS[100] }}>100 blue</span>
        <span style={{ color: LIFER_MA_COLORS[200] }}>200 yellow</span>
      </div>
      <label className="absolute right-2 top-7 z-10 flex items-center gap-1.5 font-mono text-[10px] text-muted">
        <input
          type="checkbox"
          data-lifer-fill-toggle=""
          checked={fillOn}
          onChange={(e) => setFillOn(e.target.checked)}
        />
        21–200 fill
      </label>
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

function areaBetween(
  a: (readonly [number, number] | null)[],
  b: (readonly [number, number] | null)[],
): string | null {
  const segs: { a: (readonly [number, number])[]; b: (readonly [number, number])[] }[] = [];
  let cur: { a: (readonly [number, number])[]; b: (readonly [number, number])[] } | null = null;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (pa && pb) {
      if (!cur) cur = { a: [], b: [] };
      cur.a.push(pa);
      cur.b.push(pb);
    } else if (cur) {
      segs.push(cur);
      cur = null;
    }
  }
  if (cur) segs.push(cur);
  const d = segs
    .filter((s) => s.a.length > 1)
    .map((s) => {
      let out = `M ${s.a[0]![0]} ${s.a[0]![1]}`;
      for (const p of s.a.slice(1)) out += ` L ${p[0]} ${p[1]}`;
      for (let i = s.b.length - 1; i >= 0; i--) out += ` L ${s.b[i]![0]} ${s.b[i]![1]}`;
      return `${out} Z`;
    })
    .join(" ");
  return d || null;
}

function fmt(value: number, digits?: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const d = digits ?? (abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6);
  return value.toLocaleString("en-US", { maximumFractionDigits: d });
}
