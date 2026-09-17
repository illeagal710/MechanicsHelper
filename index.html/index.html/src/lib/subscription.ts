import type { Role } from "@/lib/store";

/**
 * Provider billing for Mechanics Helper.
 *
 * Customers are always free. Shops and independents run their portal (job
 * board, ticket ops, QR/find-code) behind a subscription: a new provider is
 * `locked` until they start a free trial or subscribe. Actual card processing
 * is not wired yet — `startSubscription` on the server marks the account
 * `active` for a stub period, which is the seam a real provider (e.g. Stripe
 * Checkout + webhooks) drops into later. All access decisions live here so the
 * UI gate, the Account screen, and any future server enforcement agree.
 */

export type SubStatus = "none" | "trialing" | "active" | "canceled";

/** Persisted per-account billing columns (added to mh_users in 0010). */
export type SubscriptionFields = {
  subStatus?: SubStatus;
  /** ms epoch the free trial ends; meaningful while `trialing`. */
  trialEndsAt?: number;
  /** ms epoch the current paid period ends; meaningful when `active`/`canceled`. */
  subRenewsAt?: number;
};

export const DAY_MS = 86_400_000;
export const TRIAL_DAYS = 14;
/** Stub paid period until a real payment provider drives renewals. */
export const PAID_PERIOD_DAYS = 30;

export type PlanId = "shop" | "independent";

export type Plan = {
  id: PlanId;
  /** Monthly price in whole USD. Placeholder pricing — tune before launch. */
  priceMonthly: number;
  /** i18n keys for the marketing bullet points shown on the paywall. */
  featureKeys: readonly string[];
};

export const PLANS: Record<PlanId, Plan> = {
  shop: {
    id: "shop",
    priceMonthly: 49,
    featureKeys: [
      "pay.feat.board",
      "pay.feat.team",
      "pay.feat.qr",
      "pay.feat.updates",
    ],
  },
  independent: {
    id: "independent",
    priceMonthly: 19,
    featureKeys: [
      "pay.feat.board",
      "pay.feat.qr",
      "pay.feat.updates",
      "pay.feat.mobile",
    ],
  },
};

/** Only shops and independents pay; customers are always free. */
export function requiresSubscription(role: Role): boolean {
  return role === "shop" || role === "independent";
}

export function planForRole(role: Role): Plan | null {
  if (role === "shop") return PLANS.shop;
  if (role === "independent") return PLANS.independent;
  return null;
}

export type AccessState = "free" | "trialing" | "active" | "locked";

type SubUser = SubscriptionFields & { role: Role };

/**
 * The provider's current access to the portal. `locked` means the paywall must
 * be shown instead of the job board / ticket / share screens.
 */
export function subscriptionAccess(user: SubUser, now: number = Date.now()): AccessState {
  if (!requiresSubscription(user.role)) return "free";
  const status: SubStatus = user.subStatus ?? "none";
  if (status === "active") {
    // A stub period that has elapsed with no renewal falls back to locked.
    return typeof user.subRenewsAt === "number" && user.subRenewsAt <= now ? "locked" : "active";
  }
  if (status === "canceled") {
    // Canceled but paid through the end of the current period.
    return typeof user.subRenewsAt === "number" && user.subRenewsAt > now ? "active" : "locked";
  }
  if (status === "trialing") {
    return typeof user.trialEndsAt === "number" && user.trialEndsAt > now ? "trialing" : "locked";
  }
  return "locked"; // "none" — never started a trial or subscription
}

/** Whether the provider portal should be open (trial, active, or a free customer). */
export function hasPortalAccess(user: SubUser, now?: number): boolean {
  return subscriptionAccess(user, now) !== "locked";
}

/** Whole days left in the free trial (0 once it has ended). */
export function trialDaysLeft(user: SubUser, now: number = Date.now()): number {
  if (typeof user.trialEndsAt !== "number") return 0;
  return Math.max(0, Math.ceil((user.trialEndsAt - now) / DAY_MS));
}

/** A free trial can only be started once, before any prior billing state. */
export function canStartTrial(user: SubUser): boolean {
  return requiresSubscription(user.role) && (user.subStatus ?? "none") === "none";
}

/** Persisted fields for starting the free trial. */
export function startTrialFields(now: number = Date.now()): {
  subStatus: SubStatus;
  trialEndsAt: number;
} {
  return { subStatus: "trialing", trialEndsAt: now + TRIAL_DAYS * DAY_MS };
}

/** Persisted fields for a successful (stubbed) subscription activation. */
export function activateFields(now: number = Date.now()): {
  subStatus: SubStatus;
  subRenewsAt: number;
} {
  return { subStatus: "active", subRenewsAt: now + PAID_PERIOD_DAYS * DAY_MS };
}
