import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type { ProductInput } from "@/lib/member.schemas";
import { parseProductInput } from "@/lib/member.schemas";

/** All members with aggregated purchase stats. Admins only. */
export const adminListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string } | undefined) => ({
    search: (input?.search ?? "").trim().slice(0, 100),
  }))
  .handler(async ({ data, context }) => {
    const { requireAdmin, listMembersWithStats } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return listMembersWithStats(data.search);
  });

/** Activate, suspend or expire a membership. */
export const adminSetMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; status: string }) => {
    if (!input?.memberId) throw new Error("A member is required.");
    if (!["active", "suspended", "expired"].includes(input.status)) {
      throw new Error("Invalid membership status.");
    }
    return { memberId: input.memberId, status: input.status };
  })
  .handler(async ({ data, context }) => {
    const { requireAdmin, setMemberStatus } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return setMemberStatus(data.memberId, data.status);
  });

/** Issues a fresh 6-digit PIN and returns it once. */
export const adminResetMemberPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string }) => {
    if (!input?.memberId) throw new Error("A member is required.");
    return { memberId: input.memberId };
  })
  .handler(async ({ data, context }) => {
    const { requireAdmin, resetMemberPin } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return resetMemberPin(data.memberId);
  });

/** Full purchase history across all members. */
export const adminListPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId?: string } | undefined) => ({
    memberId: input?.memberId ?? undefined,
  }))
  .handler(async ({ data, context }) => {
    const { requireAdmin, listAllPurchases } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return listAllPurchases(data.memberId);
  });

/** Product catalogue for the admin (includes inactive products). */
export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, listAllProducts } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return listAllProducts();
  });

/** Create or update a product of any type. */
export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => parseProductInput(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin, saveProduct } = await import("@/lib/admin.server");
    await requireAdmin(context.supabase, context.userId);
    return saveProduct(data);
  });
