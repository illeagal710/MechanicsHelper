/**
 * Provider billing for Mechanics Helper.
 *
 * Who pays: shop owners and independents. Who never pays: customers.
 * Shop technicians do not get a plan, checkout, or lock screen — they inherit
 * the owner's subscription. If that shop is locked, the tech is locked too.
 *
 * Subscribe opens Stripe Checkout. It does not mark the account paid.
 * A signature-checked webhook is the only writer of a paid `active` period
 * and the only writer that locks a lapsed or canceled one. If Stripe env is
 * missing, subscribe fails closed and the 14-day trial still works.
 *
 * Prices below are placeholder amounts shown in the app. The charge is the
 * Stripe Price id from the environment, never a key committed in this repo.
 *
 * Access decisions live in this module. The paywall, the Account plan card,
 * and server checks on provider mutations all call these functions.
 */

export type Role = "customer" | "shop" | "independent";
export type ShopRole = "owner" | "tech";

export type SubStatus = "none" | "trialing" | "active" | "canceled" | "comped";

/** Columns on mh_users (migration 0015). 0010 is address — do not reuse it. */
export type SubscriptionFields = {
  subStatus?: SubStatus;
  /** ms epoch the free trial ends. Meaningful while `trialing`. */
  trialEndsAt?: number;
  /** ms epoch the stub paid period ends. Meaningful when `active` or `canceled`. */
  subRenewsAt?: number;
};

export type BillingUser = SubscriptionFields & {
  role: Role;
  shopRole?: ShopRole | string;
  shopId?: string;
};

export const DAY_MS = 86_400_000;
export const TRIAL_DAYS = 14;
/**
 * Access-gate fixture for an elapsed paid period. Live renewals use Stripe
 * `current_period_end`. Subscribe does not write this stub.
 */
export const PAID_PERIOD_DAYS = 30;

export const PORTAL_LOCKED_ERROR = "Subscribe or start a trial to use the shop portal.";
export const TRIAL_USED_ERROR = "Your free trial has already been used.";
export const PAYER_ONLY_ERROR = "Only the shop owner or an independent can subscribe.";
export const TECH_ASK_OWNER_ERROR = "Ask the shop owner to start a trial or subscribe.";
export const PAYMENTS_NOT_SET_UP = "Payments aren't set up yet. You can still start the free trial.";
export const CHECKOUT_NOT_REQUIRED = "This account is already included. Checkout isn't required.";
export const ALREADY_ACTIVE_ERROR = "This subscription is already active.";

export type PlanId = "shop" | "independent";

export type Plan = {
  id: PlanId;
  /**
   * Monthly price in whole USD shown in the app.
   * Placeholder amount. Checkout charges the Stripe Price from the environment.
   */
  priceMonthly: number;
  /** i18n keys for the paywall bullets. */
  featureKeys: readonly string[];
};

export const PLANS: Record<PlanId, Plan> = {
  shop: {
    id: "shop",
    // Placeholder amount. Live charge is STRIPE_PRICE_SHOP.
    priceMonthly: 49,
    featureKeys: ["pay.feat.board", "pay.feat.team", "pay.feat.qr", "pay.feat.updates"],
  },
  independent: {
    id: "independent",
    // Placeholder amount. Live charge is STRIPE_PRICE_INDEPENDENT.
    priceMonthly: 19,
    featureKeys: ["pay.feat.board", "pay.feat.qr", "pay.feat.updates", "pay.feat.mobile"],
  },
};

export type AccessState = "free" | "trialing" | "active" | "locked";

export function parseSubStatus(raw: unknown): SubStatus {
  if (raw === "trialing" || raw === "active" || raw === "canceled" || raw === "comped" || raw === "none") {
    return raw;
  }
  return "none";
}

/** Shop owners and independents are the only payers. Technicians are not. */
export function isPayer(user: BillingUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "independent") return true;
  if (user.role === "shop" && user.shopRole !== "tech") return true;
  return false;
}

export function planForRole(role: Role): Plan | null {
  if (role === "shop") return PLANS.shop;
  if (role === "independent") return PLANS.independent;
  return null;
}

/** The row whose subscription the actor uses. Techs resolve to the shop owner. */
export function billingRecord<T extends BillingUser>(actor: T, directory: readonly T[]): T | null {
  if (actor.role === "customer" || actor.role === "independent") return actor;
  if (actor.role === "shop" && actor.shopRole === "tech") {
    return (
      directory.find(
        (row) => row.role === "shop" && row.shopRole === "owner" && !!row.shopId && row.shopId === actor.shopId,
      ) ?? null
    );
  }
  if (actor.role === "shop") return actor;
  return null;
}

/**
 * Access for one billing row (the payer, or a customer).
 * Do not pass a technician here — use `portalAccess`, which inherits the owner.
 */
export function subscriptionAccess(user: BillingUser, now: number = Date.now()): AccessState {
  if (user.role === "customer") return "free";
  if (user.role !== "shop" && user.role !== "independent") return "free";
  const status: SubStatus = user.subStatus ?? "none";
  // Comped demo/reviewer rows stay open with no renewal date and no checkout.
  if (status === "comped") return "active";
  if (status === "active") {
    // No renewal timestamp: grandfathered or comped-as-active. A stub period
    // that has elapsed falls back to locked.
    return typeof user.subRenewsAt === "number" && user.subRenewsAt <= now ? "locked" : "active";
  }
  if (status === "canceled") {
    return typeof user.subRenewsAt === "number" && user.subRenewsAt > now ? "active" : "locked";
  }
  if (status === "trialing") {
    return typeof user.trialEndsAt === "number" && user.trialEndsAt > now ? "trialing" : "locked";
  }
  return "locked";
}

/** Portal access for any signed-in person, including a tech inheriting the owner. */
export function portalAccess(
  actor: BillingUser,
  directory: readonly BillingUser[] = [],
  now: number = Date.now(),
): AccessState {
  if (actor.role === "customer") return "free";
  if (actor.role === "shop" && actor.shopRole === "tech") {
    const owner = billingRecord(actor, directory);
    if (!owner) return "locked";
    return subscriptionAccess(owner, now);
  }
  return subscriptionAccess(actor, now);
}

export function hasPortalAccess(actor: BillingUser, directory: readonly BillingUser[] = [], now?: number): boolean {
  return portalAccess(actor, directory, now) !== "locked";
}

/**
 * Customers always pass. A locked shop owner, independent, or tech (inherited)
 * does not. Active, trialing, comped, and grandfathered payers pass.
 */
export function providerMutationAllowed(
  actor: BillingUser | null | undefined,
  directory: readonly BillingUser[],
  now: number = Date.now(),
): boolean {
  if (!actor || actor.role === "customer") return true;
  return portalAccess(actor, directory, now) !== "locked";
}

export function trialDaysLeft(user: BillingUser, now: number = Date.now()): number {
  if (typeof user.trialEndsAt !== "number") return 0;
  return Math.max(0, Math.ceil((user.trialEndsAt - now) / DAY_MS));
}

/** One free trial, only from a payer who has never started billing. */
export function canStartTrial(user: BillingUser): boolean {
  return isPayer(user) && (user.subStatus ?? "none") === "none";
}

export function startTrialFields(now: number = Date.now()): { subStatus: SubStatus; trialEndsAt: number } {
  return { subStatus: "trialing", trialEndsAt: now + TRIAL_DAYS * DAY_MS };
}

/** Gate fixture. The Stripe webhook writes `active` plus Stripe's period end, not this stub. */
export function activateFields(now: number = Date.now()): { subStatus: SubStatus; subRenewsAt: number } {
  return { subStatus: "active", subRenewsAt: now + PAID_PERIOD_DAYS * DAY_MS };
}

/**
 * Comped rows, and `active` rows with no renewal, were grandfathered.
 * A paid Stripe period always has a numeric `subRenewsAt`, so it is not this.
 */
export function isGrandfatheredOrComped(user: BillingUser): boolean {
  const status = user.subStatus ?? "none";
  if (status === "comped") return true;
  return status === "active" && typeof user.subRenewsAt !== "number";
}

/**
 * Who may be sent to Stripe Checkout.
 * Customers and technicians cannot. Grandfathered and comped accounts cannot.
 * A payer who already has access through a paid period is not sent again.
 * Locked and trialing payers can.
 */
export function canStartCheckout(user: BillingUser, now: number = Date.now()): boolean {
  if (!isPayer(user)) return false;
  if (isGrandfatheredOrComped(user)) return false;
  return subscriptionAccess(user, now) !== "active";
}

/** Webhook may update a real payer. It must not rewrite grandfathered or comped rows. */
export function billingWriteAllowed(user: BillingUser): boolean {
  return isPayer(user) && !isGrandfatheredOrComped(user);
}
