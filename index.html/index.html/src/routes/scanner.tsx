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
        content:
          "Scan Binance USDT pairs for Crypto Lifers 4h 21×200 cross alerts, 50/200 death-cross warnings, and the pre-trade checklist. Alerts only unless you arm WEEX separately.",
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
