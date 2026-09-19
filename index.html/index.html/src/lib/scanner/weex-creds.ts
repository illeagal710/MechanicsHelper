const KEY = "mh.weex.creds.local";

export type LocalCreds = {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

/** Browser localStorage on this machine only. Never git, never the project store. */
export function loadLocalCreds(): LocalCreds | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCreds;
    if (!parsed.apiKey || !parsed.apiSecret || !parsed.passphrase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalCreds(creds: LocalCreds) {
  localStorage.setItem(KEY, JSON.stringify(creds));
}

export function clearLocalCreds() {
  localStorage.removeItem(KEY);
}

export function maskKey(apiKey: string): string {
  if (apiKey.length < 8) return "••••";
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}
