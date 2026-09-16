import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/legal-pages";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms of Use · Mechanics Helper" }],
  }),
});
