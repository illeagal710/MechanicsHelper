/** Shop owner vs technician portal gates. Independent mechanics are not shop staff. */

export type ShopRole = "owner" | "tech";

export type ShopRoleUser = {
  role?: string;
  shopRole?: ShopRole | string;
  shopId?: string;
  shopName?: string;
  name?: string;
};

export type AssignableJob = {
  assignedTo?: string;
  status: string;
  slot: string;
  createdAt: number;
};

export function isShopOwner(user: ShopRoleUser | null | undefined): boolean {
  return !!user && user.role === "shop" && user.shopRole === "owner";
}

export function isShopTechnician(user: ShopRoleUser | null | undefined): boolean {
  return !!user && user.role === "shop" && user.shopRole === "tech";
}

/** Customer find-code / Share tab — owner and independents. Techs do not advertise the shop. */
export function canShareCustomerQr(user: ShopRoleUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "independent") return true;
  return isShopOwner(user);
}

export function canRotateFindCode(user: ShopRoleUser | null | undefined): boolean {
  return canShareCustomerQr(user);
}

/** Team-join / employee invite — owner only. Never the same value as the customer find code. */
export function canSeeTeamJoinCode(user: ShopRoleUser | null | undefined): boolean {
  return isShopOwner(user);
}

export function canEditShopProfile(user: ShopRoleUser | null | undefined): boolean {
  return isShopOwner(user) && !!user?.shopId;
}

export function canManageShopTeam(user: ShopRoleUser | null | undefined): boolean {
  return canEditShopProfile(user);
}

/** Owner delete also takes down the shop. Tech delete is personal login only. */
export function canDeleteShop(user: ShopRoleUser | null | undefined): boolean {
  return isShopOwner(user);
}

export function shopPortalKind(
  user: ShopRoleUser | null | undefined,
): "owner" | "tech" | "independent" | "customer" | "" {
  if (!user) return "";
  if (user.role === "independent") return "independent";
  if (isShopOwner(user)) return "owner";
  if (isShopTechnician(user)) return "tech";
  if (user.role === "customer") return "customer";
  return "";
}

export function namesMatch(a?: string, b?: string): boolean {
  const left = String(a || "").trim().toLowerCase();
  const right = String(b || "").trim().toLowerCase();
  return !!left && left === right;
}

export function isAssignedToUser(job: { assignedTo?: string }, user: ShopRoleUser | null | undefined): boolean {
  return namesMatch(job.assignedTo, user?.name);
}

/** Keep Open/Ready/History order, but list this tech's assigned tickets first. */
export function rankShopJobsForViewer<T extends AssignableJob>(jobs: T[], user: ShopRoleUser | null | undefined): T[] {
  if (!isShopTechnician(user)) return jobs;
  return [...jobs].sort((a, b) => Number(isAssignedToUser(b, user)) - Number(isAssignedToUser(a, user)));
}

export function techPortalLabel(shopName: string, fallback = "Shop"): string {
  return `Technician · ${shopName.trim() || fallback}`;
}

/** Owner, technician, and independent share a full-width shell from the md breakpoint up. Customers stay phone-narrow. */
export function usesWideProviderShell(user: ShopRoleUser | null | undefined): boolean {
  return user?.role === "shop" || user?.role === "independent";
}
