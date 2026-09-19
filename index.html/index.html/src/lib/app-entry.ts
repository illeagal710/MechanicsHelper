/** Query/path helpers for the public Mechanics Helper SPA entry. */

export type AppEntrySearch = {
  view?: "login";
  ref?: string;
};

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

export function initialViewFromSearch(search: AppEntrySearch): "welcome" | "login" {
  return search.view === "login" ? "login" : "welcome";
}
