/**
 * Stripe Checkout + webhook decisions.
 *
 * Keys, the webhook secret, and price ids come from the environment only.
 * Never hardcode them. Missing config fails closed: no paid write, no fetch.
 * The browser return URL is not payment. `handleStripeWebhook` is the only
 * path that produces a paid or lapsed billing write.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ALREADY_ACTIVE_ERROR,
  CHECKOUT_NOT_REQUIRED,
  PAYER_ONLY_ERROR,
  PAYMENTS_NOT_SET_UP,
  TECH_ASK_OWNER_ERROR,
  TRIAL_USED_ERROR,
  canStartCheckout,
  canStartTrial,
  isGrandfatheredOrComped,
  isPayer,
  planForRole,
  startTrialFields,
  type BillingUser,
  type PlanId,
  type SubStatus,
} from "./subscription.ts";

export const STRIPE_SIGNATURE_TOLERANCE_SEC = 300;

export type StripeEnv = {
  secretKey?: string;
  webhookSecret?: string;
  priceShop?: string;
  priceIndependent?: string;
};

function pick(source: Record<string, string | undefined>, key: string): string | undefined {
  const value = source[key]?.trim();
  return value || undefined;
}

/** Read Stripe settings. Empty strings count as missing. */
export function readStripeEnv(source: Record<string, string | undefined> = process.env): StripeEnv {
  return {
    secretKey: pick(source, "STRIPE_SECRET_KEY"),
    webhookSecret: pick(source, "STRIPE_WEBHOOK_SECRET"),
    priceShop: pick(source, "STRIPE_PRICE_SHOP"),
    priceIndependent: pick(source, "STRIPE_PRICE_INDEPENDENT"),
  };
}

export function safeOrigin(raw: string | undefined): string {
  if (!raw) return "http://localhost:8080";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "http://localhost:8080";
    return url.origin;
  } catch {
    return "http://localhost:8080";
  }
}

/** Return-URL query params are never proof that a card was charged. */
export function paymentFromReturnUrl(_params: URLSearchParams | Record<string, string | null>): null {
  return null;
}

export type TrialDecision =
  | { action: "deny"; error: string }
  | { action: "trial"; fields: { subStatus: SubStatus; trialEndsAt: number } };

/** Free trial. Does not read Stripe config and does not create a Checkout Session. */
export function decideTrial(user: BillingUser, now: number = Date.now()): TrialDecision {
  if (user.role === "shop" && user.shopRole === "tech") return { action: "deny", error: TECH_ASK_OWNER_ERROR };
  if (!isPayer(user)) return { action: "deny", error: PAYER_ONLY_ERROR };
  if (!canStartTrial(user)) return { action: "deny", error: TRIAL_USED_ERROR };
  return { action: "trial", fields: startTrialFields(now) };
}

export type SubscribeDecision =
  | { action: "deny"; error: string }
  | { action: "not_setup"; error: typeof PAYMENTS_NOT_SET_UP }
  | { action: "checkout"; priceId: string; secretKey: string };

export function decideSubscribe(user: BillingUser, env: StripeEnv, now: number = Date.now()): SubscribeDecision {
  env = {
    secretKey: env.secretKey?.trim() || undefined,
    webhookSecret: env.webhookSecret?.trim() || undefined,
    priceShop: env.priceShop?.trim() || undefined,
    priceIndependent: env.priceIndependent?.trim() || undefined,
  };
  if (user.role === "shop" && user.shopRole === "tech") return { action: "deny", error: TECH_ASK_OWNER_ERROR };
  if (!isPayer(user)) return { action: "deny", error: PAYER_ONLY_ERROR };
  if (isGrandfatheredOrComped(user)) return { action: "deny", error: CHECKOUT_NOT_REQUIRED };
  if (!canStartCheckout(user, now)) return { action: "deny", error: ALREADY_ACTIVE_ERROR };
  const plan = planForRole(user.role);
  if (!plan) return { action: "deny", error: PAYER_ONLY_ERROR };
  const priceId = priceFor(env, plan.id);
  if (!env.secretKey || !env.webhookSecret || !priceId) {
    return { action: "not_setup", error: PAYMENTS_NOT_SET_UP };
  }
  return { action: "checkout", priceId, secretKey: env.secretKey };
}

function priceFor(env: StripeEnv, plan: PlanId): string | undefined {
  return plan === "shop" ? env.priceShop : env.priceIndependent;
}

/** True only when this payer's Checkout can be created. Never includes secret values. */
export function paymentsReadyFor(role: BillingUser["role"], env: StripeEnv): boolean {
  if (role !== "shop" && role !== "independent") return false;
  const decision = decideSubscribe({ role, shopRole: role === "shop" ? "owner" : undefined, subStatus: "none" }, env);
  return decision.action === "checkout";
}

export type CheckoutRequest = {
  secretKey: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
};

export function checkoutFormBody(req: Omit<CheckoutRequest, "secretKey">): string {
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", req.priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("client_reference_id", req.userId);
  params.set("metadata[userId]", req.userId);
  params.set("subscription_data[metadata][userId]", req.userId);
  params.set("success_url", req.successUrl);
  params.set("cancel_url", req.cancelUrl);
  return params.toString();
}

export function isCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

export async function postCheckoutSession(
  req: CheckoutRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let response: Response;
  try {
    response = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${req.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutFormBody(req),
    });
  } catch {
    return { ok: false, error: PAYMENTS_NOT_SET_UP };
  }
  if (!response.ok) return { ok: false, error: PAYMENTS_NOT_SET_UP };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: PAYMENTS_NOT_SET_UP };
  }
  const url = payload && typeof payload === "object" && "url" in payload ? (payload as { url?: unknown }).url : undefined;
  if (typeof url !== "string" || !isCheckoutUrl(url)) return { ok: false, error: PAYMENTS_NOT_SET_UP };
  return { ok: true, url };
}

export type BillingStart =
  | { ok: true; kind: "trial"; fields: { subStatus: SubStatus; trialEndsAt: number } }
  | { ok: true; kind: "checkout"; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Trial writes local trial fields. Subscribe either returns a Checkout URL
 * or an error. It never returns paid fields.
 */
export async function beginProviderBilling(args: {
  user: BillingUser;
  userId: string;
  mode: "trial" | "subscribe";
  env: StripeEnv;
  origin: string;
  now?: number;
  fetchImpl?: typeof fetch;
}): Promise<BillingStart> {
  const now = args.now ?? Date.now();
  if (args.mode === "trial") {
    const decision = decideTrial(args.user, now);
    if (decision.action === "deny") return { ok: false, error: decision.error };
    return { ok: true, kind: "trial", fields: decision.fields };
  }
  const decision = decideSubscribe(args.user, args.env, now);
  if (decision.action !== "checkout") return { ok: false, error: decision.error };
  const origin = safeOrigin(args.origin);
  const session = await postCheckoutSession(
    {
      secretKey: decision.secretKey,
      priceId: decision.priceId,
      userId: args.userId,
      successUrl: new URL("/?billing=return", origin).toString(),
      cancelUrl: new URL("/?billing=cancel", origin).toString(),
    },
    args.fetchImpl,
  );
  if (!session.ok) return session;
  return { ok: true, kind: "checkout", checkoutUrl: session.url };
}

export function verifyStripeSignature(
  payload: string,
  header: string | null | undefined,
  secret: string | undefined,
  nowSec: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret || !header) return false;
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") timestamp = value;
    else if (key === "v1" && value) signatures.push(value);
  }
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const stamp = Number(timestamp);
  if (!Number.isFinite(stamp) || Math.abs(nowSec - stamp) > STRIPE_SIGNATURE_TOLERANCE_SEC) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return signatures.some((sig) => {
    const got = Buffer.from(sig, "utf8");
    if (got.length !== expectedBuf.length) return false;
    return timingSafeEqual(got, expectedBuf);
  });
}

export type BillingWrite = {
  userId: string;
  subStatus: "active" | "canceled";
  subRenewsAt: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function userIdFrom(obj: Record<string, unknown> | null): string | undefined {
  if (!obj) return undefined;
  if (typeof obj.client_reference_id === "string" && obj.client_reference_id) return obj.client_reference_id;
  const meta = asRecord(obj.metadata);
  if (meta && typeof meta.userId === "string" && meta.userId) return meta.userId;
  return undefined;
}

function periodEndMs(obj: Record<string, unknown> | null): number | undefined {
  if (!obj) return undefined;
  const end = obj.current_period_end;
  if (typeof end === "number" && Number.isFinite(end) && end > 0) return Math.round(end * 1000);
  return undefined;
}

const LAPSED = new Set(["canceled", "unpaid", "incomplete_expired", "past_due"]);

/**
 * Map a verified Stripe event onto the columns the paywall already reads.
 * Unpaid Checkout sessions do not activate. A paid session or an `active`
 * subscription needs `current_period_end` so the row is not mistaken for a
 * grandfathered account (active with no renewal).
 */
export function interpretStripeEvent(event: unknown): BillingWrite | null {
  const ev = asRecord(event);
  if (!ev || typeof ev.type !== "string") return null;
  const data = asRecord(ev.data);
  const obj = data ? asRecord(data.object) : null;
  if (!obj) return null;

  if (ev.type === "checkout.session.completed") {
    if (obj.payment_status !== "paid") return null;
    const userId = userIdFrom(obj);
    if (!userId) return null;
    const subscription = typeof obj.subscription === "object" ? asRecord(obj.subscription) : null;
    const renews = periodEndMs(subscription) ?? periodEndMs(obj);
    if (renews === undefined) return null;
    return { userId, subStatus: "active", subRenewsAt: renews };
  }

  if (ev.type === "customer.subscription.created" || ev.type === "customer.subscription.updated") {
    const userId = userIdFrom(obj);
    if (!userId) return null;
    const status = obj.status;
    if (status === "active") {
      const renews = periodEndMs(obj);
      if (renews === undefined) return null;
      return { userId, subStatus: "active", subRenewsAt: renews };
    }
    if (typeof status === "string" && LAPSED.has(status)) {
      return { userId, subStatus: "canceled", subRenewsAt: 0 };
    }
    return null;
  }

  if (ev.type === "customer.subscription.deleted") {
    const userId = userIdFrom(obj);
    if (!userId) return null;
    return { userId, subStatus: "canceled", subRenewsAt: 0 };
  }

  return null;
}

export async function handleStripeWebhook(args: {
  payload: string;
  signature: string | null;
  secret: string | undefined;
  nowSec?: number;
  apply: (write: BillingWrite) => Promise<void>;
}): Promise<{ status: number; body: string; applied: boolean }> {
  if (!verifyStripeSignature(args.payload, args.signature, args.secret, args.nowSec)) {
    return { status: 400, body: "invalid signature", applied: false };
  }
  let event: unknown;
  try {
    event = JSON.parse(args.payload);
  } catch {
    return { status: 400, body: "invalid payload", applied: false };
  }
  const write = interpretStripeEvent(event);
  if (!write) return { status: 200, body: "ignored", applied: false };
  try {
    await args.apply(write);
  } catch {
    return { status: 500, body: "apply failed", applied: false };
  }
  return { status: 200, body: "ok", applied: true };
}
