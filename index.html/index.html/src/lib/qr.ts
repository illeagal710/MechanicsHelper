import QRCode from "qrcode";

export type ReferralLocation = {
  origin: string;
  pathname: string;
};

export function referralLocation(): ReferralLocation {
  if (typeof window === "undefined") return { origin: "", pathname: "/" };
  return { origin: window.location.origin, pathname: window.location.pathname };
}

/** Same URL the shop QR uses: origin + path + ?ref=CODE. */
export function referralUrl(code: string, loc: ReferralLocation = referralLocation()) {
  return `${loc.origin}${loc.pathname}?ref=${encodeURIComponent(code)}`;
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function referralSharePayload(
  title: string,
  code: string,
  text: string,
  loc: ReferralLocation = referralLocation(),
) {
  return { title, text, url: referralUrl(code, loc) };
}

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 280,
    color: { dark: "#0c1220", light: "#fff7ed" },
    errorCorrectionLevel: "M",
  });
}

export async function qrPrintDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    margin: 2,
    width: 1024,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
}
