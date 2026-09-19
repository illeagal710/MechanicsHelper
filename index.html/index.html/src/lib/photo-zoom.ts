export function clampZoom(n: number): number {
  return Math.min(4, Math.max(1, n));
}

/** Pan is locked at 1x. When zoomed, stay inside the overflow of the viewport. */
export function clampPan(
  x: number,
  y: number,
  scale: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  if (scale <= 1) return { x: 0, y: 0 };
  const w = Math.max(1, viewW);
  const h = Math.max(1, viewH);
  const maxX = (w * (scale - 1)) / 2;
  const maxY = (h * (scale - 1)) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}
