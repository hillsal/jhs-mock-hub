import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhs } from "@/lib/ghana";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "JHS Membership & Prediction Packages | Hills Examination Board" },
      {
        name: "description",
        content:
          "See Hills Examination Board mock types and BECE prediction packages, with flat pricing for registered JHS schools in Ghana.",
      },
      { property: "og:title", content: "JHS Membership & Prediction Packages" },
      {
        property: "og:description",
        content: "Mock examination types and prediction package pricing for Ghanaian JHS schools.",
      },
    ],
  }),
  component: MembershipPage,
});

const FLOW = [
  ["Step 1", "School information"],
  ["Step 2", "Students & candidates"],
  ["Step 3", "Select mock"],
  ["Step 4", "Select prediction"],
  ["Step 5", "Order summary"],
  ["Step 6", "Online payment"],
  ["Step 7", "Prediction access"],
];

function MembershipPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue"],
    queryFn: async () => {
      const [{ data: mocks, error: e1 }, { data: products, error: e2 }] = await Promise.all([
        supabase.from("mock_types").select("*").eq("is_active", true).order("sort_order"),
        supabase
          .from("prediction_products")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { mocks: mocks ?? [], products: products ?? [] };
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="heb-gradient px-4 py-14 text-primary-foreground">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold md:text-4xl">JHS Membership</h1>
            <p className="mt-3 max-w-2xl opacity-90">
              Register once (GHS 200 membership fee), then buy prediction packages for any mock
              examination. Each prediction package is a flat GHS 1,000.00.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Registration flow</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map(([step, label]) => (
              <div key={step} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {step}
                </p>
                <p className="mt-1 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="text-2xl font-bold">Mock examinations</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {isLoading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)
              : data?.mocks.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="p-5">
                      <h3 className="font-serif text-base font-bold">{m.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-bold">Prediction packages</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)
              : data?.products.map((p) => (
                  <Card key={p.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="font-serif text-base">{p.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.subjects.map((s: string) => (
                          <Badge key={s} variant="secondary" className="font-normal">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {formatGhs(Number(p.price_per_candidate))}
                        </p>
                        <p className="text-xs text-muted-foreground">Flat price per package</p>
                        <Button asChild className="mt-4 w-full">
                          <Link to="/register">Register & buy</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
