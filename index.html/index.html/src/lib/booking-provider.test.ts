import assert from "node:assert/strict";
import { test } from "node:test";
import { bookProviderUi, resolveBookingProvider } from "./booking-provider.ts";
import type { Provider } from "./store.ts";

const riverside: Provider = {
  id: "s-main",
  type: "shop",
  name: "Riverside Auto",
  detail: "Repair shop",
  code: "RIV4",
  bio: "",
};
const leon: Provider = {
  id: "u-indy",
  type: "independent",
  name: "Leon Mobile Repair",
  detail: "Mobile mechanic",
  code: "LEON",
  bio: "",
};
const otherShop: Provider = {
  id: "s-other",
  type: "shop",
  name: "Other Garage",
  detail: "Repair shop",
  code: "OTHR",
  bio: "",
};
const providers = [riverside, leon, otherShop];

const customer = {
  id: "u-maya",
  role: "customer" as const,
  email: "maya@example.com",
  phone: "5550148821",
};

test("linked customer hides shop picker (QR / referral lock)", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: riverside,
    providers,
    jobs: [],
  });
  assert.equal(provider?.id, "s-main");
  assert.equal(bookProviderUi(provider), "locked");
});

test("linked customer hides shop picker (saved find code on the account)", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: null,
    providers,
    jobs: [],
    linkedCode: "leon",
  });
  assert.equal(provider?.code, "LEON");
  assert.equal(bookProviderUi(provider), "locked");
});

test("linked customer hides shop picker (saved shopId on the account)", () => {
  const provider = resolveBookingProvider({
    user: { ...customer, shopId: "s-main" },
    locked: null,
    providers,
    jobs: [],
  });
  assert.equal(provider?.name, "Riverside Auto");
  assert.equal(bookProviderUi(provider), "locked");
});

test("linked customer hides shop picker (last ticket with that bay)", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: null,
    providers,
    jobs: [
      {
        userId: customer.id,
        email: customer.email,
        phone: customer.phone,
        providerId: "s-main",
        providerType: "shop",
        createdAt: 10,
      },
      {
        userId: customer.id,
        email: customer.email,
        phone: customer.phone,
        providerId: "s-other",
        providerType: "shop",
        createdAt: 99,
      },
    ],
  });
  assert.equal(provider?.id, "s-other");
  assert.equal(bookProviderUi(provider), "locked");
});

test("QR lock wins over an older saved ticket so a new referral lands on the right bay", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: leon,
    providers,
    jobs: [
      {
        userId: customer.id,
        email: customer.email,
        phone: customer.phone,
        providerId: "s-main",
        providerType: "shop",
        createdAt: 500,
      },
    ],
    linkedCode: "RIV4",
  });
  assert.equal(provider?.code, "LEON");
});

test("unlinked customer is sent to find-code, not a shop directory", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: null,
    providers,
    jobs: [],
  });
  assert.equal(provider, null);
  assert.equal(bookProviderUi(provider), "link-code");
});

test("shop booker is auto-assigned their own bay, not a chooser", () => {
  const provider = resolveBookingProvider({
    user: {
      id: "u-shop",
      role: "shop",
      email: "shop@example.com",
      phone: "5550100000",
      shopId: "s-main",
    },
    locked: leon,
    providers,
    jobs: [],
  });
  assert.equal(provider?.id, "s-main");
  assert.equal(bookProviderUi(provider), "locked");
});

test("independent booker is auto-assigned themselves, not a chooser", () => {
  const provider = resolveBookingProvider({
    user: {
      id: "u-indy",
      role: "independent",
      email: "indy@example.com",
      phone: "5550166000",
    },
    locked: riverside,
    providers,
    jobs: [],
  });
  assert.equal(provider?.id, "u-indy");
  assert.equal(bookProviderUi(provider), "locked");
});

test("explicit unlink does not snap back to last ticket", () => {
  const provider = resolveBookingProvider({
    user: customer,
    locked: null,
    providers,
    jobs: [
      {
        userId: customer.id,
        email: customer.email,
        phone: customer.phone,
        providerId: "s-main",
        providerType: "shop",
        createdAt: 10,
      },
    ],
    linkedCode: "",
    allowSavedBay: false,
  });
  assert.equal(provider, null);
  assert.equal(bookProviderUi(provider), "link-code");
});

test("guest with a QR lock books that shop without an account", () => {
  const provider = resolveBookingProvider({
    user: null,
    locked: riverside,
    providers,
    jobs: [],
  });
  assert.equal(provider?.code, "RIV4");
  assert.equal(bookProviderUi(provider), "locked");
});

test("guest without a lock cannot pick from a shop directory", () => {
  const provider = resolveBookingProvider({
    user: null,
    locked: null,
    providers,
    jobs: [],
  });
  assert.equal(provider, null);
  assert.equal(bookProviderUi(provider), "link-code");
});
