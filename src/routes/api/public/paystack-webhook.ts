import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretKey = process.env["PAYSTACK_SECRET_KEY"];
        if (!secretKey) return new Response("Not configured", { status: 500 });

        const body = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secretKey).update(body).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          event?: string;
          data?: { reference?: string; status?: string; channel?: string; paid_at?: string };
        };
        const reference = event.data?.reference;
        if (!reference) return new Response("ok");

        if (event.event === "charge.success" || event.event === "charge.failed") {
          const { applyPaystackResult } = await import("@/lib/paystack.server");
          await applyPaystackResult({
            reference,
            succeeded: event.event === "charge.success" && event.data?.status === "success",
            channel: event.data?.channel ?? null,
            paidAt: event.data?.paid_at ?? null,
          });
        }

        return new Response("ok");
      },
    },
  },
});
