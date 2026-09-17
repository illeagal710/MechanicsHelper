import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canDeleteShop,
  canEditShopProfile,
  canManageShopTeam,
  canRotateFindCode,
  canSeeTeamJoinCode,
  canShareCustomerQr,
  isAssignedToUser,
  isShopOwner,
  isShopTechnician,
  rankShopJobsForViewer,
  shopPortalKind,
  techPortalLabel,
  usesWideProviderShell,
} from "./shop-role.ts";

const owner = { role: "shop" as const, shopRole: "owner" as const, shopId: "s-main", shopName: "Riverside Auto", name: "Shop Desk" };
const tech = { role: "shop" as const, shopRole: "tech" as const, shopId: "s-main", shopName: "Riverside Auto", name: "Alex Ruiz" };
const indy = { role: "independent" as const, name: "Leon Miles" };
const customer = { role: "customer" as const, name: "Maya Chen" };

test("shop owner keeps Share, team join code, and shop Account edits", () => {
  assert.equal(isShopOwner(owner), true);
  assert.equal(isShopTechnician(owner), false);
  assert.equal(shopPortalKind(owner), "owner");
  assert.equal(canShareCustomerQr(owner), true);
  assert.equal(canRotateFindCode(owner), true);
  assert.equal(canSeeTeamJoinCode(owner), true);
  assert.equal(canEditShopProfile(owner), true);
  assert.equal(canManageShopTeam(owner), true);
  assert.equal(canDeleteShop(owner), true);
  assert.equal(usesWideProviderShell(owner), true);
});

test("shop technician does not see team-join QR, Share, or shop Account controls", () => {
  assert.equal(isShopTechnician(tech), true);
  assert.equal(isShopOwner(tech), false);
  assert.equal(shopPortalKind(tech), "tech");
  assert.equal(canShareCustomerQr(tech), false);
  assert.equal(canRotateFindCode(tech), false);
  assert.equal(canSeeTeamJoinCode(tech), false);
  assert.equal(canEditShopProfile(tech), false);
  assert.equal(canManageShopTeam(tech), false);
  assert.equal(canDeleteShop(tech), false);
  assert.equal(techPortalLabel(tech.shopName), "Technician · Riverside Auto");
  assert.equal(usesWideProviderShell(tech), true);
});

test("independent keeps Share; customer has no shop portal", () => {
  assert.equal(canShareCustomerQr(indy), true);
  assert.equal(canRotateFindCode(indy), true);
  assert.equal(canSeeTeamJoinCode(indy), false);
  assert.equal(canEditShopProfile(indy), false);
  assert.equal(shopPortalKind(indy), "independent");
  assert.equal(canShareCustomerQr(customer), false);
  assert.equal(shopPortalKind(customer), "customer");
  assert.equal(usesWideProviderShell(indy), true);
  assert.equal(usesWideProviderShell(customer), false);
  assert.equal(usesWideProviderShell(null), false);
});

test("shop technician uses the same wide provider shell as owner and independent", () => {
  assert.equal(usesWideProviderShell(owner), true);
  assert.equal(usesWideProviderShell(tech), true);
  assert.equal(usesWideProviderShell(indy), true);
  assert.equal(usesWideProviderShell(customer), false);
});

test("tech jobs board lists assigned tickets first and keeps the rest in place", () => {
  const jobs = [
    { id: "MH-OPEN", status: "scheduled", slot: "2026-09-18T13:00:00.000Z", createdAt: 1, assignedTo: "" },
    { id: "MH-MINE", status: "repair", slot: "2026-09-18T16:00:00.000Z", createdAt: 2, assignedTo: "Alex Ruiz" },
    { id: "MH-DESK", status: "ready", slot: "2026-09-18T08:00:00.000Z", createdAt: 3, assignedTo: "Shop Desk" },
  ];
  assert.deepEqual(
    rankShopJobsForViewer(jobs, tech).map((j) => j.id),
    ["MH-MINE", "MH-OPEN", "MH-DESK"],
  );
  assert.deepEqual(
    rankShopJobsForViewer(jobs, owner).map((j) => j.id),
    ["MH-OPEN", "MH-MINE", "MH-DESK"],
  );
  assert.equal(isAssignedToUser(jobs[1], tech), true);
  assert.equal(isAssignedToUser(jobs[1], owner), false);
  assert.equal(isAssignedToUser(jobs[0], tech), false);
});
