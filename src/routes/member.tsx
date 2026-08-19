import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { getMemberAccount, verifyPurchasePayment, getProductDownload } from "@/lib/member.functions";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/member.schemas";
import { clearMemberSession, readMemberSession, type MemberSession } from "@/lib/member-session";
import { MemberAccess } from "@/components/member/member-access";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhs } from "@/lib/ghana";

export const Route = createFileRoute("/member")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search["reference"] === "string" ? search["reference"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Member Account | Hills Examination Board" },
      {
        name: "description",
        content:
          "Sign in with your Hills Examination Board Serial Number and PIN to view your membership, purchases and downloads.",
      },
      { property: "og:title", content: "My Member Account — Hills Examination Board" },
      {
        property: "og:description",
        content: "One member account for every mock, prediction and provision you purchase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberPage,
});

function MemberPage() {
  const { reference } = useSearch({ from: "/member" });
  const [session, setSession] = useState<MemberSession | null>(null);
  const [verified, setVerified] = useState(false);
  const verify = useServerFn(verifyPurchasePayment);
  const download = useServerFn(getProductDownload);

  useEffect(() => {
    setSession(readMemberSession());
  }, []);

  const account = useQuery({
    queryKey: ["member-account", session?.token],
    enabled: !!session,
    queryFn: () => getMemberAccount({ data: { token: session!.token } }),
  });

  useEffect(() => {
    if (!reference || !session || verified) return;
    setVerified(true);
    verify({ data: { token: session.token, reference } })
      .then((result) => {
        if (result.status === "success") {
          toast.success("Payment verified — your product is now available.");
        } else {
          toast.error("This payment was not successful.");
        }
        account.refetch();
      })
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Could not verify the payment."),
      );
  }, [reference, session, verified, verify, account]);

  async function openDownload(purchaseId: string) {
    if (!session) return;
    try {
      const { url } = await download({ data: { token: session.token, purchaseId } });
      window.open(url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download not available.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 py-12">
        <div className="mx-auto max-w-5xl px-4">
          {!session ? (
            <MemberAccess
              title="Member Access"
              description="Enter your Serial Number and PIN to open your member account."
              onAuthenticated={setSession}
            />
          ) : account.isLoading ? (
            <Skeleton className="h-64" />
          ) : account.isError ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-sm text-destructive">
                {account.error instanceof Error ? account.error.message : "Could not load account."}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  clearMemberSession();
                  setSession(null);
                }}
              >
                Sign in again
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Serial Number
                    </p>
                    <p className="font-mono text-lg font-bold text-primary">
                      {account.data?.member.membership_id}
                    </p>
                    <h1 className="mt-2 font-serif text-2xl font-bold">
                      {account.data?.member.school_name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {account.data?.member.district}, {account.data?.member.region} ·{" "}
                      {account.data?.member.academic_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        account.data?.member.membership_status === "active" ? "default" : "secondary"
                      }
                    >
                      {account.data?.member.membership_status?.toUpperCase()}
                    </Badge>
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
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Button asChild variant="outline">
                    <Link to="/buy/mock">Buy Mock</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/buy/prediction">Buy Prediction</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/buy/provision">Buy Provision</Link>
                  </Button>
                </div>
              </div>

              <section>
                <h2 className="mb-3 font-serif text-xl font-bold">My purchases</h2>
                {(account.data?.purchases.length ?? 0) === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    You have not purchased anything yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.data?.purchases.map((purchase) => {
                          const product = purchase.products as {
                            name: string;
                            product_type: ProductType;
                            file_path: string | null;
                          } | null;
                          const paid = purchase.payment_status === "successful";
                          return (
                            <tr key={purchase.id} className="border-t border-border">
                              <td className="px-4 py-3 font-medium">{product?.name ?? "Product"}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {product ? PRODUCT_TYPE_LABELS[product.product_type] : "—"}
                              </td>
                              <td className="px-4 py-3">{formatGhs(Number(purchase.amount))}</td>
                              <td className="px-4 py-3">
                                <Badge variant={paid ? "default" : "secondary"}>
                                  {purchase.payment_status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(
                                  purchase.purchased_at ?? purchase.created_at,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                {paid && product?.file_path ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDownload(purchase.id)}
                                  >
                                    <Download className="mr-1 size-4" /> Download
                                  </Button>
                                ) : paid ? (
                                  <span className="text-xs text-muted-foreground">
                                    Processing / delivery
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Awaiting payment</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
