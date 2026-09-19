import { createFileRoute } from "@tanstack/react-router";
import { MechanicsApp } from "@/components/mechanics-app";
import { initialViewFromSearch, parseAppEntrySearch } from "@/lib/app-entry";

export const Route = createFileRoute("/")({
  validateSearch: parseAppEntrySearch,
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  return <MechanicsApp initialView={initialViewFromSearch(search)} />;
}
