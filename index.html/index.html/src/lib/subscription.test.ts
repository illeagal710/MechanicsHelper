import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAY_MS,
  PLANS,
  activateFields,
  canStartTrial,
  hasPortalAccess,
  planForRole,
  requiresSubscription,
  startTrialFields,
  subscriptionAccess,
  trialDaysLeft,
} from "./subscription.ts";

const NOW = 1_700_000_000_000;

test("customers are always free — never gated", () => {
  assert.equal(requiresSubscription("customer"), false);
  assert.equal(subscriptionAccess({ role: "customer" }, NOW), "free");
  assert.equal(hasPortalAccess({ role: "customer" }, NOW), true);
  assert.equal(planForRole("customer"), null);
});

test("shops and independents require a subscription and have a plan", () => {
  assert.equal(requiresSubscription("shop"), true);
  assert.equal(requiresSubscription("independent"), true);
  assert.equal(planForRole("shop"), PLANS.shop);
  assert.equal(planForRole("independent"), PLANS.independent);
});

test("a brand-new provider (no billing state) is locked", () => {
  assert.equal(subscriptionAccess({ role: "shop" }, NOW), "locked");
  assert.equal(subscriptionAccess({ role: "independent", subStatus: "none" }, NOW), "locked");
  assert.equal(hasPortalAccess({ role: "shop" }, NOW), false);
});

test("an in-window trial grants access; an expired trial locks", () => {
  const active = { role: "shop" as const, subStatus: "trialing" as const, trialEndsAt: NOW + DAY_MS };
  assert.equal(subscriptionAccess(active, NOW), "trialing");
  assert.equal(hasPortalAccess(active, NOW), true);

  const expired = { role: "shop" as const, subStatus: "trialing" as const, trialEndsAt: NOW - 1 };
  assert.equal(subscriptionAccess(expired, NOW), "locked");
  assert.equal(hasPortalAccess(expired, NOW), false);
});

test("an active subscription grants access until the stub period elapses", () => {
  assert.equal(subscriptionAccess({ role: "shop", subStatus: "active" }, NOW), "active");
  assert.equal(
    subscriptionAccess({ role: "shop", subStatus: "active", subRenewsAt: NOW + DAY_MS }, NOW),
    "active",
  );
  assert.equal(
    subscriptionAccess({ role: "shop", subStatus: "active", subRenewsAt: NOW - 1 }, NOW),
    "locked",
  );
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

test("trialDaysLeft rounds up remaining whole days and floors at zero", () => {
  assert.equal(trialDaysLeft({ role: "shop", trialEndsAt: NOW + 14 * DAY_MS }, NOW), 14);
  assert.equal(trialDaysLeft({ role: "shop", trialEndsAt: NOW + DAY_MS + 1 }, NOW), 2);
  assert.equal(trialDaysLeft({ role: "shop", trialEndsAt: NOW - DAY_MS }, NOW), 0);
  assert.equal(trialDaysLeft({ role: "shop" }, NOW), 0);
});

test("a trial can only be started from the pristine 'none' state", () => {
  assert.equal(canStartTrial({ role: "shop", subStatus: "none" }), true);
  assert.equal(canStartTrial({ role: "shop" }), true);
  assert.equal(canStartTrial({ role: "shop", subStatus: "trialing" }), false);
  assert.equal(canStartTrial({ role: "shop", subStatus: "active" }), false);
  assert.equal(canStartTrial({ role: "customer" }), false);
});

test("startTrialFields opens a 14-day trial window", () => {
  const f = startTrialFields(NOW);
  assert.equal(f.subStatus, "trialing");
  assert.equal(f.trialEndsAt, NOW + 14 * DAY_MS);
  assert.equal(hasPortalAccess({ role: "shop", ...f }, NOW), true);
});

test("activateFields marks active with a future renewal", () => {
  const f = activateFields(NOW);
  assert.equal(f.subStatus, "active");
  assert.equal(f.subRenewsAt, NOW + 30 * DAY_MS);
  assert.equal(subscriptionAccess({ role: "shop", ...f }, NOW), "active");
});
