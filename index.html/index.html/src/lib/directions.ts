/**
 * Turn a shop / independent street address into a "Get directions" deep link.
 * Apple devices (iPhone/iPad/Mac) open Apple Maps; everything else opens Google
 * Maps. Both URLs are universal links that hand off to the native maps app when
 * installed and fall back to the web otherwise.
 */

/** True for iOS / iPadOS / macOS user agents, which should prefer Apple Maps. */
export function preferAppleMaps(ua: string | undefined | null): boolean {
  const s = String(ua || "");
  if (!s) return false;
  // iPadOS 13+ reports as "Macintosh"; both should use Apple Maps.
  return /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(s) && !/Android/i.test(s);
}

/**
 * A directions URL for `address`, or "" when the address is blank.
 * Pass `apple` to force a platform (otherwise it is detected from the UA).
 */
export function mapsDirectionsUrl(
  address: string,
  opts: { apple?: boolean; userAgent?: string } = {},
): string {
  const query = String(address || "").trim();
  if (!query) return "";
  const encoded = encodeURIComponent(query);
  const apple = opts.apple ?? preferAppleMaps(opts.userAgent);
  return apple
    ? `https://maps.apple.com/?daddr=${encoded}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

/**
 * Open the maps app for `address` in a new tab/window. No-op when the address is
 * empty or when there is no `window` (SSR).
 */
export function openDirections(address: string): void {
  if (typeof window === "undefined") return;
  const url = mapsDirectionsUrl(address, {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
