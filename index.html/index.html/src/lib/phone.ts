/** Digits (and a leading +) from a stored phone string. */
export function phoneDigits(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const plus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

function enoughDigits(digits: string): boolean {
  return digits.replace(/\D/g, "").length >= 7;
}

export function telHref(raw: string): string {
  const digits = phoneDigits(raw);
  if (!enoughDigits(digits)) return "";
  return `tel:${digits}`;
}

/** First stored number that can open the phone app. */
export function firstReachablePhone(...raw: Array<string | undefined>): string {
  for (const value of raw) {
    const digits = phoneDigits(String(value || ""));
    if (enoughDigits(digits)) return digits;
  }
  return "";
}

export function smsHref(raw: string, body = ""): string {
  const digits = phoneDigits(raw);
  if (!enoughDigits(digits)) return "";
  const q = String(body || "").trim() ? `?body=${encodeURIComponent(String(body).trim())}` : "";
  return `sms:${digits}${q}`;
}

export function customerSmsKey(status: string): "job.smsBodyEnroute" | "job.smsBodyParts" | "job.smsBodyReady" | "job.smsBodyUpdate" {
  if (status === "enroute") return "job.smsBodyEnroute";
  if (status === "parts") return "job.smsBodyParts";
  if (status === "ready") return "job.smsBodyReady";
  return "job.smsBodyUpdate";
}
