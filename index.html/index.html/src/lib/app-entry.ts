/** Query/path helpers for the public Mechanics Helper SPA entry. */

export type AppEntrySearch = {
  view?: "login";
  ref?: string;
};

export type GuestLanding = "welcome" | "login" | "provider";

export function parseAppEntrySearch(raw: Record<string, unknown>): AppEntrySearch {
  const out: AppEntrySearch = {};
  if (raw.view === "login") out.view = "login";
  if (typeof raw.ref === "string" && raw.ref.trim()) out.ref = raw.ref.trim();
  return out;
}

/** `/login` lands on the in-app Log in screen, keeping `?ref=` and other params. */
export function loginRedirectHref(search = ""): string {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const q = new URLSearchParams(raw);
  q.set("view", "login");
  return `/?${q.toString()}`;
}

export function initialViewFromSearch(search: AppEntrySearch): GuestLanding {
  if (search.view === "login") return "login";
  if (search.ref) return "provider";
  return "welcome";
}

/**
 * Unsigned QR / find-code visits open the public shop page.
 * Booking does not require an account; creating one is optional for tracking.
 */
export function guestLandingView(opts: {
  wantsLogin: boolean;
  signedIn: boolean;
  hasProvider: boolean;
}): GuestLanding {
  if (opts.wantsLogin) return "login";
  if (!opts.signedIn && opts.hasProvider) return "provider";
  return "welcome";
}
