import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  adminListMembers,
  adminListProducts,
  adminListPurchases,
  adminResetMemberPin,
  adminSaveProduct,
  adminSetMemberStatus,
} from "@/lib/admin.functions";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/member.schemas";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGhs } from "@/lib/ghana";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Hills Examination Board" },
      { name: "description", content: "Manage members, products and purchases." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-secondary/30 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 font-serif text-3xl font-bold">Admin Dashboard</h1>
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="mt-6">
              <MembersTab />
            </TabsContent>
            <TabsContent value="purchases" className="mt-6">
              <PurchasesTab />
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <ProductsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function MembersTab() {
  const [search, setSearch] = useState("");
  const listMembers = useServerFn(adminListMembers);
  const setStatus = useServerFn(adminSetMemberStatus);
  const resetPin = useServerFn(adminResetMemberPin);

  const members = useQuery({
    queryKey: ["admin-members", search],
    queryFn: () => listMembers({ data: { search } }),
  });

  async function changeStatus(memberId: string, status: string) {
    try {
      await setStatus({ data: { memberId, status } });
      toast.success(`Membership ${status}`);
      members.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the member.");
    }
  }

  async function newPin(memberId: string) {
    try {
      const { pin } = await resetPin({ data: { memberId } });
      toast.success(`New PIN: ${pin}`, { duration: 20000 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset the PIN.");
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, serial number, email or contact person"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {members.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3">School</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Serial</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Candidates</th>
                <th className="px-3 py-3">Purchases</th>
                <th className="px-3 py-3">Spent</th>
                <th className="px-3 py-3">Registered</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.data?.map((member) => (
                <tr key={member.id} className="border-t border-border align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium">{member.school_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.district}, {member.region}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <p>{member.contact_person ?? "—"}</p>
                    <p className="text-muted-foreground">{member.school_phone}</p>
                    <p className="text-muted-foreground">{member.school_email}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{member.membership_id}</td>
                  <td className="px-3 py-3">
                    <Badge variant={member.membership_status === "active" ? "default" : "secondary"}>
                      {member.membership_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{member.mock_candidates}</td>
                  <td className="px-3 py-3">{member.totalPurchases}</td>
                  <td className="px-3 py-3">{formatGhs(member.totalSpent)}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {member.membership_status !== "active" && (
                        <Button size="sm" variant="outline" onClick={() => changeStatus(member.id, "active")}>
                          Activate
                        </Button>
                      )}
                      {member.membership_status !== "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => changeStatus(member.id, "suspended")}
                        >
                          Suspend
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => newPin(member.id)}>
                        Reset PIN
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PurchasesTab() {
  const listPurchases = useServerFn(adminListPurchases);
  const purchases = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: () => listPurchases({ data: {} }),
  });

  if (purchases.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-3">Member</th>
            <th className="px-3 py-3">Product</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Reference</th>
            <th className="px-3 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {purchases.data?.map((purchase) => {
            const member = purchase.schools as {
              school_name: string;
              membership_id: string;
            } | null;
            const product = purchase.products as {
              name: string;
              product_type: ProductType;
            } | null;
            return (
              <tr key={purchase.id} className="border-t border-border">
                <td className="px-3 py-3">
                  <p className="font-medium">{member?.school_name ?? "—"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{member?.membership_id}</p>
                </td>
                <td className="px-3 py-3">{product?.name ?? "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {product ? PRODUCT_TYPE_LABELS[product.product_type] : "—"}
                </td>
                <td className="px-3 py-3">{formatGhs(Number(purchase.amount))}</td>
                <td className="px-3 py-3">
                  <Badge variant={purchase.payment_status === "successful" ? "default" : "secondary"}>
                    {purchase.payment_status}
                  </Badge>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                  {purchase.transaction_reference ?? "—"}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {new Date(purchase.purchased_at ?? purchase.created_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY_PRODUCT = {
  id: undefined as string | undefined,
  name: "",
  productType: "prediction" as ProductType,
  description: "",
  price: "0",
  pricingMode: "flat" as "flat" | "per_candidate",
  academicYear: String(new Date().getFullYear()),
  subject: "",
  filePath: "",
  isActive: true,
};

function ProductsTab() {
  const listProductsFn = useServerFn(adminListProducts);
  const saveProductFn = useServerFn(adminSaveProduct);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [busy, setBusy] = useState(false);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listProductsFn({ data: undefined }),
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await saveProductFn({ data: { ...form, price: Number(form.price) } });
      toast.success(form.id ? "Product updated" : "Product created");
      setForm({ ...EMPTY_PRODUCT });
      products.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Year</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.data?.map((product) => (
              <tr key={product.id} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{product.name}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {PRODUCT_TYPE_LABELS[product.product_type as ProductType]}
                </td>
                <td className="px-3 py-3">
                  {formatGhs(Number(product.price))}
                  {product.pricing_mode === "per_candidate" ? " / candidate" : ""}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{product.academic_year ?? "—"}</td>
                <td className="px-3 py-3">
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "active" : "inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        id: product.id,
                        name: product.name,
                        productType: product.product_type as ProductType,
                        description: product.description ?? "",
                        price: String(product.price),
                        pricingMode: product.pricing_mode as "flat" | "per_candidate",
                        academicYear: product.academic_year ?? "",
                        subject: product.subject ?? "",
                        filePath: product.file_path ?? "",
                        isActive: product.is_active,
                      })
                    }
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="font-serif text-lg font-bold">{form.id ? "Edit product" : "New product"}</h2>
        <div className="space-y-2">
          <Label htmlFor="p-name">Product name</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-type">Product type</Label>
          <Select
            value={form.productType}
            onValueChange={(v) => setForm({ ...form, productType: v as ProductType })}
          >
            <SelectTrigger id="p-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {PRODUCT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-price">Price (GHS)</Label>
            <Input
              id="p-price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-mode">Pricing</Label>
            <Select
              value={form.pricingMode}
              onValueChange={(v) => setForm({ ...form, pricingMode: v as "flat" | "per_candidate" })}
            >
              <SelectTrigger id="p-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat price</SelectItem>
                <SelectItem value="per_candidate">Per candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-year">Academic year</Label>
            <Input
              id="p-year"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-subject">Subject / category</Label>
            <Input
              id="p-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-file">File path (private storage)</Label>
          <Input
            id="p-file"
            value={form.filePath}
            onChange={(e) => setForm({ ...form, filePath: e.target.value })}
            placeholder="predictions/2026-bece-maths.pdf"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active (visible to members)
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : form.id ? "Update product" : "Create product"}
          </Button>
          {form.id && (
            <Button type="button" variant="ghost" onClick={() => setForm({ ...EMPTY_PRODUCT })}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
