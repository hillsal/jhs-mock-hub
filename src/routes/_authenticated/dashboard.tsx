import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhs } from "@/lib/ghana";
import { initializePayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "School Dashboard | Hills Examination Board" },
      {
        name: "description",
        content:
          "View your JHS membership details, mock candidates, orders and prediction access.",
      },
      { property: "og:title", content: "School Dashboard | Hills Examination Board" },
      { property: "og:description", content: "Your JHS membership and prediction orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const startPayment = useServerFn(initializePayment);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function pay(orderId: string) {
    setPayingId(orderId);
    try {
      const { authorizationUrl } = await startPayment({
        data: { orderId, callbackUrl: `${window.location.origin}/payment` },
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      setPayingId(null);
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["school-dashboard"],
    queryFn: async () => {
      const { data: school, error } = await supabase
        .from("schools")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!school) return { school: null, orders: [] };

      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("*, prediction_products(name), mock_types(name)")
        .eq("school_id", school.id)
        .order("created_at", { ascending: false });
      if (orderError) throw orderError;
      return { school, orders: orders ?? [] };
    },
  });

  const school = data?.school;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-8">
          {isLoading && <Skeleton className="h-40 w-full" />}

          {!isLoading && !school && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">No school registered yet</CardTitle>
                <CardDescription>
                  Complete the membership registration to activate your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/register">Start registration</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {school && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Serial / Membership number
                    </p>
                    <p className="font-mono text-lg font-bold text-primary">
                      {school.membership_id}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your PIN is stored securely and never displayed. Contact the administrator if
                      you need it reset.
                    </p>

                    <h1 className="mt-2 font-serif text-2xl font-bold">{school.school_name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {school.district}, {school.region} · {school.school_type}
                    </p>
                  </div>
                  <Badge variant={school.membership_status === "active" ? "default" : "secondary"}>
                    {school.membership_status}
                  </Badge>
                </div>
                <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Stat label="Total JHS students" value={String(school.total_jhs_students)} />
                  <Stat label="Mock candidates" value={String(school.mock_candidates)} />
                  <Stat label="School email" value={school.school_email} />
                </dl>
              </div>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-bold">Orders</h2>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/register">New order</Link>
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {data?.orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                  )}
                  {data?.orders.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {o.order_number}
                          </p>
                          <p className="font-semibold">
                            {o.prediction_products?.name ?? "Prediction package"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {o.mock_types?.name} · {o.candidate_count} candidates
                            {Number(o.registration_fee) > 0 && " · incl. registration fee"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatGhs(Number(o.amount))}
                          </p>
                          <Badge
                            variant={o.payment_status === "paid" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {o.payment_status}
                          </Badge>
                          {o.payment_status !== "paid" && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                disabled={payingId === o.id}
                                onClick={() => void pay(o.id)}
                              >
                                {payingId === o.id ? "Redirecting…" : "Pay with Paystack"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium break-words">{value}</dd>
    </div>
  );
}
