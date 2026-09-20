/** Digits (and a leading +) from a stored phone string. */
export function phoneDigits(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const plus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

/** Public US numbers as (661) 202-4288. Leaves short/international strings as stored. */
export function formatPublicPhone(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return s;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
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
