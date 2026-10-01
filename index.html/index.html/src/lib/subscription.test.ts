import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAY_MS,
  PAID_PERIOD_DAYS,
  PLANS,
  TRIAL_DAYS,
  activateFields,
  canStartTrial,
  hasPortalAccess,
  isPayer,
  planForRole,
  portalAccess,
  providerMutationAllowed,
  startTrialFields,
  subscriptionAccess,
  trialDaysLeft,
} from "./subscription.ts";

const NOW = 1_700_000_000_000;

const owner = (patch: Record<string, unknown> = {}) => ({
  role: "shop" as const,
  shopRole: "owner" as const,
  shopId: "s1",
  ...patch,
});

const tech = (patch: Record<string, unknown> = {}) => ({
  role: "shop" as const,
  shopRole: "tech" as const,
  shopId: "s1",
  subStatus: "none" as const,
  ...patch,
});

test("customers are always free and never a payer", () => {
  const customer = { role: "customer" as const };
  assert.equal(isPayer(customer), false);
  assert.equal(planForRole("customer"), null);
  assert.equal(subscriptionAccess(customer, NOW), "free");
  assert.equal(portalAccess(customer, [], NOW), "free");
  assert.equal(hasPortalAccess(customer, [], NOW), true);
  assert.equal(providerMutationAllowed(customer, [], NOW), true);
  assert.equal(canStartTrial(customer), false);
});

test("shop and independent plans use placeholder monthly prices", () => {
  assert.equal(isPayer(owner()), true);
  assert.equal(isPayer({ role: "independent" }), true);
  assert.equal(planForRole("shop"), PLANS.shop);
  assert.equal(planForRole("independent"), PLANS.independent);
  // Placeholder USD amounts — not live charges.
  assert.equal(PLANS.shop.priceMonthly, 49);
  assert.equal(PLANS.independent.priceMonthly, 19);
});

test("a brand-new shop or independent with no billing state is locked", () => {
  assert.equal(subscriptionAccess(owner(), NOW), "locked");
  assert.equal(subscriptionAccess({ role: "independent", subStatus: "none" }, NOW), "locked");
  assert.equal(hasPortalAccess(owner(), [], NOW), false);
  assert.equal(providerMutationAllowed(owner(), [], NOW), false);
  assert.equal(providerMutationAllowed({ role: "independent" }, [], NOW), false);
});

test("an in-window trial grants access and an expired trial locks", () => {
  const active = owner({ subStatus: "trialing", trialEndsAt: NOW + DAY_MS });
  assert.equal(subscriptionAccess(active, NOW), "trialing");
  assert.equal(portalAccess(active, [active], NOW), "trialing");
  assert.equal(hasPortalAccess(active, [], NOW), true);
  assert.equal(providerMutationAllowed(active, [], NOW), true);

  const expired = owner({ subStatus: "trialing", trialEndsAt: NOW - 1 });
  assert.equal(subscriptionAccess(expired, NOW), "locked");
  assert.equal(providerMutationAllowed(expired, [], NOW), false);
});

test("an active subscription grants access until the stub period elapses", () => {
  assert.equal(subscriptionAccess(owner({ subStatus: "active", subRenewsAt: NOW + DAY_MS }), NOW), "active");
  assert.equal(subscriptionAccess(owner({ subStatus: "active", subRenewsAt: NOW - 1 }), NOW), "locked");
  assert.equal(
    providerMutationAllowed(owner({ subStatus: "active", subRenewsAt: NOW + DAY_MS }), [], NOW),
    true,
  );
});

test("grandfathered and comped rows stay open without a renewal charge", () => {
  assert.equal(subscriptionAccess(owner({ subStatus: "active" }), NOW), "active");
  assert.equal(subscriptionAccess({ role: "independent", subStatus: "comped" }, NOW), "active");
  assert.equal(
    subscriptionAccess({ role: "independent", subStatus: "comped", subRenewsAt: NOW - DAY_MS }, NOW),
    "active",
  );
  assert.equal(providerMutationAllowed({ role: "shop", shopRole: "owner", subStatus: "comped" }, [], NOW), true);
});

test("a canceled subscription keeps access until the paid period ends", () => {
  assert.equal(
    subscriptionAccess({ role: "independent", subStatus: "canceled", subRenewsAt: NOW + DAY_MS }, NOW),
    "active",
  );
  assert.equal(
    subscriptionAccess({ role: "independent", subStatus: "canceled", subRenewsAt: NOW - 1 }, NOW),
    "locked",
  );
});

test("a technician inherits the owner and cannot unlock a locked shop alone", () => {
  const trialing = owner({ subStatus: "trialing", trialEndsAt: NOW + 3 * DAY_MS });
  const locked = owner({ subStatus: "none" });
  const staff = tech();
  assert.equal(isPayer(staff), false);
  assert.equal(canStartTrial(staff), false);
  assert.equal(portalAccess(staff, [trialing, staff], NOW), "trialing");
  assert.equal(providerMutationAllowed(staff, [trialing, staff], NOW), true);

  assert.equal(portalAccess(staff, [locked, staff], NOW), "locked");
  assert.equal(providerMutationAllowed(staff, [locked, staff], NOW), false);
  assert.equal(portalAccess(staff, [staff], NOW), "locked");

  const sneaky = tech({ subStatus: "active", subRenewsAt: NOW + 30 * DAY_MS });
  assert.equal(portalAccess(sneaky, [locked, sneaky], NOW), "locked");
  assert.equal(providerMutationAllowed(sneaky, [locked, sneaky], NOW), false);

  const activeOwner = owner({ subStatus: "active" });
  assert.equal(portalAccess(tech(), [activeOwner], NOW), "active");
});

test("trialDaysLeft rounds up remaining whole days and floors at zero", () => {
  assert.equal(trialDaysLeft(owner({ trialEndsAt: NOW + 14 * DAY_MS }), NOW), 14);
  assert.equal(trialDaysLeft(owner({ trialEndsAt: NOW + DAY_MS + 1 }), NOW), 2);
  assert.equal(trialDaysLeft(owner({ trialEndsAt: NOW - DAY_MS }), NOW), 0);
  assert.equal(trialDaysLeft(owner(), NOW), 0);
});

test("a trial can only be started from a payer in the pristine none state", () => {
  assert.equal(canStartTrial(owner({ subStatus: "none" })), true);
  assert.equal(canStartTrial(owner()), true);
  assert.equal(canStartTrial({ role: "independent" }), true);
  assert.equal(canStartTrial(owner({ subStatus: "trialing" })), false);
  assert.equal(canStartTrial(owner({ subStatus: "active" })), false);
  assert.equal(canStartTrial(owner({ subStatus: "comped" })), false);
  assert.equal(canStartTrial(tech()), false);
  assert.equal(canStartTrial({ role: "customer" }), false);
});

test("startTrialFields opens a 14-day trial and activateFields a stub paid period", () => {
  const trial = startTrialFields(NOW);
  assert.equal(TRIAL_DAYS, 14);
  assert.equal(trial.subStatus, "trialing");
  assert.equal(trial.trialEndsAt, NOW + 14 * DAY_MS);
  assert.equal(portalAccess({ role: "shop", shopRole: "owner", ...trial }, [], NOW), "trialing");

  const paid = activateFields(NOW);
  assert.equal(PAID_PERIOD_DAYS, 30);
  assert.equal(paid.subStatus, "active");
  assert.equal(paid.subRenewsAt, NOW + 30 * DAY_MS);
  assert.equal(subscriptionAccess({ role: "independent", ...paid }, NOW), "active");
});
