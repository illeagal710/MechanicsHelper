import { createFileRoute } from "@tanstack/react-router";
import { MechanicsApp } from "@/components/mechanics-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <MechanicsApp />;
}
