import { weexAccessSign } from "./weex-sign-node";
import { WEEX_SPOT, type WeexAccountView, type WeexNetwork } from "./weex-trade";

export type WeexCreds = {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

export type WeexSymbolInfo = {
  symbol: string;
  status: string;
  minTradeAmount: number;
  maxTradeAmount: number;
  stepSize: number;
  tickSize: number;
  enableTrade: boolean;
};

export type WeexOrderResult = {
  symbol: string;
  orderId: string;
  clientOrderId: string;
  transactTime: number;
  status: string | null;
  executedQty: string | null;
  cummulativeQuoteQty: string | null;
};

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function envCreds(): WeexCreds | null {
  const apiKey = process.env.WEEX_API_KEY?.trim() ?? "";
  const apiSecret = process.env.WEEX_API_SECRET?.trim() ?? "";
  const passphrase = process.env.WEEX_API_PASSPHRASE?.trim() ?? "";
  if (!apiKey || !apiSecret || !passphrase) return null;
  return { apiKey, apiSecret, passphrase };
}

export function weexEnvConfigured(): boolean {
  return envCreds() != null;
}

export function resolveWeexCreds(source: "env" | "session", session?: WeexCreds | null): WeexCreds {
  if (source === "env") {
    const env = envCreds();
    if (!env) throw new Error("WEEX_API_KEY / WEEX_API_SECRET / WEEX_API_PASSPHRASE are not set on the server");
    return env;
  }
  if (!session?.apiKey || !session.apiSecret || !session.passphrase) {
    throw new Error("Enter a WEEX API key, secret, and passphrase in the app");
  }
  return session;
}

const BASE = () => (process.env.WEEX_API_BASE?.trim() || WEEX_SPOT).replace(/\/$/, "");

let timeOffsetMs = 0;

async function syncTime(): Promise<void> {
  try {
    const res = await fetch(`${BASE()}/api/v3/time`, {
      headers: { accept: "application/json", "user-agent": "MechanicsHelper-Scanner/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { serverTime?: number };
    if (typeof json.serverTime === "number") timeOffsetMs = json.serverTime - Date.now();
  } catch {
    /* keep last offset */
  }
}

async function weexRequest(
  creds: WeexCreds | null,
  method: string,
  path: string,
  query = "",
  bodyObj: Record<string, unknown> | null = null,
): Promise<unknown> {
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "MechanicsHelper-Scanner/1.0",
  };
  if (body) headers["content-type"] = "application/json";
  if (creds) {
    const timestamp = String(Date.now() + timeOffsetMs);
    headers["ACCESS-KEY"] = creds.apiKey;
    headers["ACCESS-PASSPHRASE"] = creds.passphrase;
    headers["ACCESS-TIMESTAMP"] = timestamp;
    headers["ACCESS-SIGN"] = weexAccessSign(creds.apiSecret, timestamp, method, path, query, body);
  }
  const url = `${BASE()}${path}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body || undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 240) };
  }
  if (!res.ok) {
    const err = json as { msg?: string; message?: string; code?: string | number };
    throw new Error(err?.msg || err?.message || `WEEX ${res.status}: ${text.slice(0, 180)}`);
  }
  const err = json as { code?: string | number; msg?: string } | null;
  if (err && typeof err === "object" && err.code != null && Number(err.code) < 0) {
    throw new Error(err.msg || `WEEX error ${err.code}`);
  }
  return json;
}

export async function weexGetCoins(): Promise<WeexNetwork[]> {
  const raw = (await weexRequest(null, "GET", "/api/v3/coins")) as unknown[];
  if (!Array.isArray(raw)) return [];
  const usdt = raw.find((row) => row && typeof row === "object" && (row as { coin?: string }).coin === "USDT") as
    | { networkList?: Record<string, unknown>[] }
    | undefined;
  const list = Array.isArray(usdt?.networkList) ? usdt.networkList : [];
  return list.map((n) => ({
    coin: "USDT",
    network: String(n.network ?? n.name ?? ""),
    name: String(n.name ?? n.network ?? ""),
    isDefault: Boolean(n.isDefault),
    depositEnable: Boolean(n.depositEnable),
    depositDust: String(n.depositDust ?? ""),
    minConfirm: num(n.minConfirm),
  }));
}

export async function weexGetSymbol(symbol: string): Promise<WeexSymbolInfo> {
  const raw = (await weexRequest(
    null,
    "GET",
    "/api/v3/exchangeInfo",
    `symbol=${encodeURIComponent(symbol)}`,
  )) as { symbols?: Record<string, unknown>[] };
  const row = raw?.symbols?.find((s) => s.symbol === symbol) ?? raw?.symbols?.[0];
  if (!row) throw new Error(`WEEX has no ${symbol} spot pair`);
  return {
    symbol: String(row.symbol),
    status: String(row.status ?? ""),
    minTradeAmount: num(row.minTradeAmount),
    maxTradeAmount: num(row.maxTradeAmount, 1e9),
    stepSize: num(row.stepSize, 1e-8),
    tickSize: num(row.tickSize, 1e-8),
    enableTrade: row.enableTrade !== false,
  };
}

export async function weexGetAccount(creds: WeexCreds): Promise<WeexAccountView> {
  await syncTime();
  const raw = (await weexRequest(creds, "GET", "/api/v3/account")) as Record<string, unknown>;
  const balances = Array.isArray(raw.balances)
    ? (raw.balances as Record<string, unknown>[])
        .map((b) => ({
          asset: String(b.asset ?? ""),
          free: num(b.free),
          locked: num(b.locked),
        }))
        .filter((b) => b.asset && (b.free > 0 || b.locked > 0))
        .sort((a, b) => b.free + b.locked - (a.free + a.locked))
        .slice(0, 16)
    : [];
  const usdt = balances.find((b) => b.asset === "USDT");
  return {
    canTrade: Boolean(raw.canTrade),
    canDeposit: Boolean(raw.canDeposit),
    uid: typeof raw.uid === "number" ? raw.uid : null,
    balances,
    usdtFree: usdt?.free ?? 0,
    usdtLocked: usdt?.locked ?? 0,
  };
}

export async function weexPlaceMarketBuy(
  creds: WeexCreds,
  symbol: string,
  quantity: string,
  newClientOrderId: string,
): Promise<WeexOrderResult> {
  await syncTime();
  const placed = (await weexRequest(creds, "POST", "/api/v3/order", "", {
    symbol,
    side: "BUY",
    type: "MARKET",
    quantity,
    newClientOrderId,
  })) as Record<string, unknown>;
  const orderId = String(placed.orderId ?? "");
  let status: string | null = null;
  let executedQty: string | null = null;
  let cummulativeQuoteQty: string | null = null;
  if (orderId) {
    try {
      const detail = (await weexRequest(
        creds,
        "GET",
        "/api/v3/order",
        `orderId=${encodeURIComponent(orderId)}`,
      )) as Record<string, unknown>;
      status = detail.status != null ? String(detail.status) : null;
      executedQty = detail.executedQty != null ? String(detail.executedQty) : null;
      cummulativeQuoteQty = detail.cummulativeQuoteQty != null ? String(detail.cummulativeQuoteQty) : null;
    } catch {
      /* submitted is still a fill-log row */
    }
  }
  return {
    symbol: String(placed.symbol ?? symbol),
    orderId,
    clientOrderId: String(placed.clientOrderId ?? newClientOrderId),
    transactTime: num(placed.transactTime, Date.now()),
    status,
    executedQty,
    cummulativeQuoteQty,
  };
}

export async function weexCancelOpen(creds: WeexCreds, symbol: string): Promise<number> {
  await syncTime();
  try {
    const raw = await weexRequest(creds, "DELETE", "/api/v3/openOrders", `symbol=${encodeURIComponent(symbol)}`);
    return Array.isArray(raw) ? raw.length : 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not exist|-1054|no open/i.test(msg)) return 0;
    throw err;
  }
}

/** In-memory live gate for server env keys. Restarts disarmed. Session keys never use this. */
const envGate = { armed: false, killed: false };

export function getEnvLiveGate() {
  return { ...envGate };
}

export function setEnvLiveArmed(armed: boolean) {
  if (envGate.killed && armed) throw new Error("Kill switch is on — clear it before arming live env keys");
  envGate.armed = armed;
  return getEnvLiveGate();
}

export function setEnvKilled(killed: boolean) {
  envGate.killed = killed;
  if (killed) envGate.armed = false;
  return getEnvLiveGate();
}
