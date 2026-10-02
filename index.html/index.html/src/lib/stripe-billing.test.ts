import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  CHECKOUT_NOT_REQUIRED,
  PAYER_ONLY_ERROR,
  PAYMENTS_NOT_SET_UP,
  TECH_ASK_OWNER_ERROR,
  billingWriteAllowed,
} from "./subscription.ts";
import {
  beginProviderBilling,
  handleStripeWebhook,
  interpretStripeEvent,
  paymentFromReturnUrl,
  type StripeEnv,
} from "./stripe-billing.ts";

const NOW = 1_700_000_000_000;
const NOW_SEC = 1_700_000_000;
const SECRET = "whsec_unit_fixture";

const configured: StripeEnv = {
  secretKey: "sk_test_unit_fixture",
  webhookSecret: SECRET,
  priceShop: "price_shop_fixture",
  priceIndependent: "price_indy_fixture",
};

const owner = (patch: Record<string, unknown> = {}) => ({
  role: "shop" as const,
  shopRole: "owner" as const,
  shopId: "s1",
  subStatus: "none" as const,
  ...patch,
});

function sign(payload: string, secret: string, stamp: number) {
  const v1 = createHmac("sha256", secret).update(`${stamp}.${payload}`).digest("hex");
  return `t=${stamp},v1=${v1}`;
}

test("trial stays free and does not call Stripe", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    throw new Error("stripe");
  };
  const res = await beginProviderBilling({
    user: owner(),
    userId: "u-new",
    mode: "trial",
    env: {},
    origin: "http://127.0.0.1:8080",
    now: NOW,
    fetchImpl,
  });
  assert.equal(called, false);
  assert.equal(res.ok, true);
  if (!res.ok || res.kind !== "trial") throw new Error("expected a free trial");
  assert.equal(res.fields.subStatus, "trialing");
  assert.equal(res.fields.trialEndsAt, NOW + 14 * 86_400_000);
  assert.equal("checkoutUrl" in res, false);
});

test("missing Stripe keys fail closed and do not call Stripe or mark paid", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    throw new Error("stripe");
  };
  const gaps: StripeEnv[] = [
    {},
    { secretKey: configured.secretKey, webhookSecret: SECRET },
    { secretKey: configured.secretKey, priceShop: configured.priceShop },
    { webhookSecret: SECRET, priceShop: configured.priceShop },
    { secretKey: "  ", webhookSecret: " ", priceShop: " " },
  ];
  for (const env of gaps) {
    const res = await beginProviderBilling({
      user: owner(),
      userId: "u-new",
      mode: "subscribe",
      env,
      origin: "http://127.0.0.1:8080",
      now: NOW,
      fetchImpl,
    });
    assert.deepEqual(res, { ok: false, error: PAYMENTS_NOT_SET_UP });
  }
  assert.equal(called, false);
});

test("a customer and a technician cannot start checkout", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    throw new Error("stripe");
  };
  const customer = await beginProviderBilling({
    user: { role: "customer" },
    userId: "u-cust",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example",
    now: NOW,
    fetchImpl,
  });
  const tech = await beginProviderBilling({
    user: { role: "shop", shopRole: "tech", shopId: "s1", subStatus: "none" },
    userId: "u-tech",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example",
    now: NOW,
    fetchImpl,
  });
  assert.deepEqual(customer, { ok: false, error: PAYER_ONLY_ERROR });
  assert.deepEqual(tech, { ok: false, error: TECH_ASK_OWNER_ERROR });
  assert.equal(called, false);
  assert.equal(billingWriteAllowed({ role: "customer" }), false);
  assert.equal(billingWriteAllowed({ role: "shop", shopRole: "tech" }), false);
});

test("a grandfathered or comped shop is not sent to checkout", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    throw new Error("stripe");
  };
  const grandfathered = await beginProviderBilling({
    user: owner({ subStatus: "active" }),
    userId: "u-old",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example",
    now: NOW,
    fetchImpl,
  });
  const comped = await beginProviderBilling({
    user: owner({ subStatus: "comped" }),
    userId: "u-demo",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example",
    now: NOW,
    fetchImpl,
  });
  assert.deepEqual(grandfathered, { ok: false, error: CHECKOUT_NOT_REQUIRED });
  assert.deepEqual(comped, { ok: false, error: CHECKOUT_NOT_REQUIRED });
  assert.equal(called, false);
  assert.equal(billingWriteAllowed(owner({ subStatus: "active" })), false);
  assert.equal(billingWriteAllowed(owner({ subStatus: "comped" })), false);
  assert.equal(billingWriteAllowed(owner({ subStatus: "active", subRenewsAt: NOW + 1000 })), true);
});

test("configured subscribe returns a Checkout URL and does not mark the account paid", async () => {
  let body = "";
  let auth = "";
  const fetchImpl: typeof fetch = async (_url, init) => {
    body = String(init?.body ?? "");
    const headers = init?.headers as Record<string, string>;
    auth = headers.Authorization;
    return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_fixture" }), { status: 200 });
  };
  const res = await beginProviderBilling({
    user: owner(),
    userId: "u-new",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example/ignored",
    now: NOW,
    fetchImpl,
  });
  assert.equal(res.ok, true);
  if (!res.ok || res.kind !== "checkout") throw new Error("expected checkout");
  assert.equal(res.checkoutUrl, "https://checkout.stripe.com/c/pay/cs_test_fixture");
  assert.equal("subStatus" in res, false);
  assert.equal(auth, "Bearer sk_test_unit_fixture");
  assert.match(body, /mode=subscription/);
  assert.match(body, /price_shop_fixture/);
  assert.match(body, /u-new/);
  assert.doesNotMatch(body, /sk_test/);
  assert.equal(paymentFromReturnUrl(new URLSearchParams("billing=return&session_id=cs_test_fixture")), null);
});

test("an independent checkout uses the independent price", async () => {
  let body = "";
  const fetchImpl: typeof fetch = async (_url, init) => {
    body = String(init?.body ?? "");
    return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_indy" }), { status: 200 });
  };
  const res = await beginProviderBilling({
    user: { role: "independent", subStatus: "trialing", trialEndsAt: NOW + 1000 },
    userId: "u-indy",
    mode: "subscribe",
    env: configured,
    origin: "https://app.example",
    now: NOW,
    fetchImpl,
  });
  assert.equal(res.ok && res.kind === "checkout", true);
  assert.match(body, /price_indy_fixture/);
});

test("a Checkout URL that is not Stripe is rejected", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ url: "https://checkout.stripe.com.evil.test/pay" }), { status: 200 });
  const res = await beginProviderBilling({
    user: owner(),
    userId: "u-new",
    mode: "subscribe",
    env: configured,
    origin: "javascript:alert(1)",
    now: NOW,
    fetchImpl,
  });
  assert.deepEqual(res, { ok: false, error: PAYMENTS_NOT_SET_UP });
});

test("a verified webhook marks the payer active", async () => {
  const event = {
    type: "customer.subscription.updated",
    data: {
      object: {
        status: "active",
        current_period_end: NOW_SEC + 30 * 86_400,
        metadata: { userId: "u-new" },
      },
    },
  };
  const payload = JSON.stringify(event);
  let write: unknown = null;
  const result = await handleStripeWebhook({
    payload,
    signature: sign(payload, SECRET, NOW_SEC),
    secret: SECRET,
    nowSec: NOW_SEC,
    apply: async (next) => {
      write = next;
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.applied, true);
  assert.deepEqual(write, {
    userId: "u-new",
    subStatus: "active",
    subRenewsAt: (NOW_SEC + 30 * 86_400) * 1000,
  });
});

test("a paid checkout session with a period end marks the payer active", async () => {
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        payment_status: "paid",
        client_reference_id: "u-new",
        subscription: { current_period_end: NOW_SEC + 86_400 },
      },
    },
  };
  const write = interpretStripeEvent(event);
  assert.deepEqual(write, {
    userId: "u-new",
    subStatus: "active",
    subRenewsAt: (NOW_SEC + 86_400) * 1000,
  });
});

test("an unpaid checkout session does not activate", () => {
  assert.equal(
    interpretStripeEvent({
      type: "checkout.session.completed",
      data: { object: { payment_status: "unpaid", client_reference_id: "u-new", current_period_end: NOW_SEC + 10 } },
    }),
    null,
  );
  assert.equal(
    interpretStripeEvent({
      type: "checkout.session.completed",
      data: { object: { payment_status: "paid", client_reference_id: "u-new" } },
    }),
    null,
  );
});

test("a lapsed or deleted subscription locks the payer", () => {
  assert.deepEqual(
    interpretStripeEvent({
      type: "customer.subscription.deleted",
      data: { object: { status: "canceled", metadata: { userId: "u-new" }, current_period_end: NOW_SEC + 999 } },
    }),
    { userId: "u-new", subStatus: "canceled", subRenewsAt: 0 },
  );
  assert.deepEqual(
    interpretStripeEvent({
      type: "customer.subscription.updated",
      data: { object: { status: "past_due", metadata: { userId: "u-new" }, current_period_end: NOW_SEC + 999 } },
    }),
    { userId: "u-new", subStatus: "canceled", subRenewsAt: 0 },
  );
});

test("an unverified webhook is rejected and does not apply", async () => {
  const payload = JSON.stringify({
    type: "customer.subscription.updated",
    data: { object: { status: "active", current_period_end: NOW_SEC + 10, metadata: { userId: "u-new" } } },
  });
  let applied = 0;
  const apply = async () => {
    applied += 1;
  };
  const bad = await handleStripeWebhook({
    payload,
    signature: sign(payload, "whsec_other", NOW_SEC),
    secret: SECRET,
    nowSec: NOW_SEC,
    apply,
  });
  const stale = await handleStripeWebhook({
    payload,
    signature: sign(payload, SECRET, NOW_SEC - 301),
    secret: SECRET,
    nowSec: NOW_SEC,
    apply,
  });
  const missing = await handleStripeWebhook({
    payload,
    signature: sign(payload, SECRET, NOW_SEC),
    secret: undefined,
    nowSec: NOW_SEC,
    apply,
  });
  const tampered = await handleStripeWebhook({
    payload: `${payload} `,
    signature: sign(payload, SECRET, NOW_SEC),
    secret: SECRET,
    nowSec: NOW_SEC,
    apply,
  });
  assert.equal(bad.status, 400);
  assert.equal(stale.status, 400);
  assert.equal(missing.status, 400);
  assert.equal(tampered.status, 400);
  assert.equal(applied, 0);
});
