import type { Job, Provider, User } from "@/lib/store";

export type BookingProviderInput = {
  user: Pick<User, "id" | "role" | "email" | "phone" | "shopId">;
  locked: Provider | null;
  providers: Provider[];
  jobs: Pick<Job, "userId" | "email" | "phone" | "providerId" | "providerType" | "createdAt">[];
  linkedCode?: string;
  /** False after the customer explicitly unlinks — do not snap back to last ticket. */
  allowSavedBay?: boolean;
};

/** Private shop↔customer booking: never a directory of other bays. */
export type BookProviderUi = "locked" | "link-code";

export function bookProviderUi(provider: Provider | null): BookProviderUi {
  return provider ? "locked" : "link-code";
}

function matchProvider(providers: Provider[], id: string | undefined, type?: Provider["type"]) {
  if (!id) return null;
  if (type) return providers.find((p) => p.id === id && p.type === type) || null;
  return providers.find((p) => p.id === id) || null;
}

function customerOwnsJob(
  user: Pick<User, "id" | "email" | "phone">,
  job: Pick<Job, "userId" | "email" | "phone">,
) {
  if (job.userId && job.userId === user.id) return true;
  if (user.email && job.email && job.email === user.email) return true;
  if (user.phone && job.phone && job.phone === user.phone) return true;
  return false;
}

/**
 * Who receives this booking.
 * QR/referral lock, saved find code, staff bay, then last ticket — never a marketplace list.
 */
export function resolveBookingProvider(input: BookingProviderInput): Provider | null {
  const { user, locked, providers, jobs, linkedCode } = input;

  if (user.role === "shop") {
    return matchProvider(providers, user.shopId, "shop");
  }
  if (user.role === "independent") {
    return matchProvider(providers, user.id, "independent");
  }

  if (locked) {
    return matchProvider(providers, locked.id, locked.type) || locked;
  }

  if (input.allowSavedBay === false) return null;

  const code = String(linkedCode || "").trim().toUpperCase();
  if (code) {
    const byCode = providers.find((p) => p.code === code);
    if (byCode) return byCode;
  }

  if (user.shopId) {
    const byShop = matchProvider(providers, user.shopId, "shop");
    if (byShop) return byShop;
  }

  const mine = jobs
    .filter((j) => customerOwnsJob(user, j))
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  for (const job of mine) {
    const fromTicket = matchProvider(providers, job.providerId, job.providerType);
    if (fromTicket) return fromTicket;
  }

  return null;
}
