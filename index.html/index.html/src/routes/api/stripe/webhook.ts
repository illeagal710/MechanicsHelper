import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe is the only caller. The browser return URL is not consulted.
 * A bad signature never updates mh_users.
 */
export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text();
        const signature = request.headers.get("stripe-signature");
        const { handleStripeWebhook, readStripeEnv } = await import("@/lib/stripe-billing");
        const { applyStripeBilling } = await import("@/lib/mh-db.server");
        const env = readStripeEnv();
        const result = await handleStripeWebhook({
          payload,
          signature,
          secret: env.webhookSecret,
          apply: applyStripeBilling,
        });
        return new Response(result.body, { status: result.status });
      },
    },
  },
});
