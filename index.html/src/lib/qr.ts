import QRCode from "qrcode";

export function referralUrl(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  return `${origin}${path}?ref=${encodeURIComponent(code)}`;
}

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 280,
    color: { dark: "#0c1220", light: "#fff7ed" },
    errorCorrectionLevel: "M",
  });
}
