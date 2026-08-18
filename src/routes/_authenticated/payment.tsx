import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Check, X } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/_authenticated/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search["reference"] === "string" ? search["reference"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Payment Status | Hills Examination Board" },
      { name: "description", content: "Confirming your Paystack payment for your JHS mock prediction order." },
      { property: "og:title", content: "Payment Status | Hills Examination Board" },
      { property: "og:description", content: "Confirming your Paystack payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentStatus,
});

function PaymentStatus() {
  const { reference } = Route.useSearch();
  const verify = useServerFn(verifyPayment);
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Confirming your payment with Paystack…");

  useEffect(() => {
    let active = true;
    if (!reference) {
      setState("failed");
      setMessage("No payment reference was provided.");
      return;
    }
    verify({ data: { reference } })
      .then((res) => {
        if (!active) return;
        if (res.status === "success") {
          setState("success");
          setMessage("Payment received. Your prediction package has been unlocked.");
        } else {
          setState("failed");
          setMessage(`Payment status: ${res.status}. If you were debited, contact support.`);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState("failed");
        setMessage(err instanceof Error ? err.message : "Could not verify this payment.");
      });
    return () => {
      active = false;
    };
  }, [reference, verify]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 px-4 py-16">
        <Card className="mx-auto max-w-lg">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
              {state === "loading" && <Loader2 className="size-7 animate-spin text-primary" />}
              {state === "success" && <Check className="size-7 text-primary" />}
              {state === "failed" && <X className="size-7 text-destructive" />}
            </div>
            <h1 className="font-serif text-xl font-bold">
              {state === "success" ? "Payment successful" : state === "failed" ? "Payment not completed" : "Verifying payment"}
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            {reference && (
              <p className="font-mono text-xs text-muted-foreground">Ref: {reference}</p>
            )}
            {state !== "loading" && (
              <Button asChild size="lg">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
