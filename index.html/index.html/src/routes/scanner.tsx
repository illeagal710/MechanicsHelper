import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScannerApp } from "@/components/scanner-app";

export const Route = createFileRoute("/scanner")({
  component: ScannerPage,
  head: () => ({
    meta: [
      { title: "Chart scanner · Mechanics Helper" },
      {
        name: "description",
        content: "Scan Binance USDT pairs for the Crypto Lifers buy setup. Paper by default. WEEX live only when armed.",
      },
    ],
  }),
});

function ScannerPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted" data-scanner-loading="">
        Loading scanner…
      </div>
    );
  }
  return <ScannerApp />;
}
