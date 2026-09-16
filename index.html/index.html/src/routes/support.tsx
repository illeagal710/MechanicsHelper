import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/components/legal-pages";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [{ title: "Support · Mechanics Helper" }],
  }),
});
