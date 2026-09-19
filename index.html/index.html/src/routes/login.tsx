import { createFileRoute, redirect } from "@tanstack/react-router";
import { loginRedirectHref, parseAppEntrySearch } from "@/lib/app-entry";

export const Route = createFileRoute("/login")({
  validateSearch: parseAppEntrySearch,
  beforeLoad: ({ location }) => {
    throw redirect({
      href: loginRedirectHref(location.searchStr),
      replace: true,
    });
  },
});
