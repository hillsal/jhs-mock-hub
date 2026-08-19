import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { getProducts, startPurchase } from "@/lib/member.functions";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/member.schemas";
import { readMemberSession, clearMemberSession, type MemberSession } from "@/lib/member-session";
import { MemberAccess } from "@/components/member/member-access";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhs } from "@/lib/ghana";

/**
 * Shared purchase flow: MEMBER ACCESS → product list → payment.
 * Registration never happens here — members reuse their Serial Number + PIN.
 */
export function BuyFlow({
  type,
  title,
  intro,
}: {
  type: ProductType;
  title: string;
  intro: string;
}) {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const pay = useServerFn(startPurchase);

  useEffect(() => {
    setSession(readMemberSession());
  }, []);

  const products = useQuery({
    queryKey: ["products", type],
    queryFn: () => getProducts({ data: { type } }),
  });

  async function buy(productId: string) {
    if (!session) return;
    setBusyId(productId);
    try {
      const result = await pay({
        data: {
          token: session.token,
          productId,
          quantity: quantities[productId] ?? 1,
          callbackUrl: `${window.location.origin}/member`,
        },
      });
      window.location.href = result.authorizationUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start the payment.";
      if (message.includes("session has ended")) {
        clearMemberSession();
        setSession(null);
      }
      toast.error(message);
      setBusyId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-3">
              {PRODUCT_TYPE_LABELS[type]}
            </Badge>
            <h1 className="font-serif text-3xl font-bold">{title}</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>
          </div>

          {!session ? (
            <MemberAccess onAuthenticated={setSession} />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm">
                  Signed in as <span className="font-semibold">{session.memberName}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    ({session.membershipId})
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/member">My account</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      clearMemberSession();
                      setSession(null);
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>

              {products.isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-44" />
                  <Skeleton className="h-44" />
                </div>
              ) : (products.data?.length ?? 0) === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {PRODUCT_TYPE_LABELS[type].toLowerCase()} products are available right now.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {products.data?.map((product) => {
                    const perCandidate = product.pricing_mode === "per_candidate";
                    const qty = quantities[product.id] ?? 1;
                    return (
                      <Card key={product.id}>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">{product.name}</CardTitle>
                          <CardDescription>
                            {product.description ?? "Hills Examination Board resource."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                              {formatGhs(Number(product.price))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {perCandidate ? "per candidate" : "flat"}
                              {product.academic_year ? ` · ${product.academic_year}` : ""}
                            </span>
                          </div>
                          {perCandidate && (
                            <div className="space-y-1.5">
                              <Label htmlFor={`qty-${product.id}`}>Number of candidates</Label>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) =>
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.max(1, Number(e.target.value) || 1),
                                  }))
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Total: {formatGhs(Number(product.price) * qty)}
                              </p>
                            </div>
                          )}
                          <Button
                            className="w-full"
                            disabled={busyId === product.id}
                            onClick={() => buy(product.id)}
                          >
                            {busyId === product.id ? "Redirecting…" : "Buy now"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
