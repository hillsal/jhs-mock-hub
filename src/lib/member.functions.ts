import { createServerFn } from "@tanstack/react-start";

import type { ProductType, RegisterMemberInput } from "@/lib/member.schemas";
import { parseRegisterMemberInput, parseProductType } from "@/lib/member.schemas";

/** General membership registration — creates the permanent member account. */
export const registerMemberFn = createServerFn({ method: "POST" })
  .inputValidator((input: RegisterMemberInput) => parseRegisterMemberInput(input))
  .handler(async ({ data }) => {
    const { registerMember } = await import("@/lib/member.server");
    return registerMember(data);
  });

/** Serial Number + PIN sign-in. Returns a signed member session token. */
export const memberSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: { membershipId: string; pin: string }) => {
    const membershipId = (input?.membershipId ?? "").trim();
    const pin = (input?.pin ?? "").trim();
    if (!membershipId) throw new Error("Serial Number is required.");
    if (!/^\d{4,10}$/.test(pin)) throw new Error("Enter your numeric PIN.");
    return { membershipId, pin };
  })
  .handler(async ({ data }) => {
    const { verifyMemberCredentials } = await import("@/lib/member.server");
    const { createMemberToken } = await import("@/lib/member-session.server");
    const member = await verifyMemberCredentials(data.membershipId, data.pin);
    return { token: await createMemberToken(member.id), member };
  });

/** Public product catalogue, optionally filtered by product type. */
export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: ProductType } | undefined) => ({
    type: parseProductType(input?.type),
  }))
  .handler(async ({ data }) => {
    const { listProducts } = await import("@/lib/member.server");
    return listProducts(data.type);
  });

/** The signed-in member's account plus purchase history. */
export const getMemberAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: input?.token ?? "" }))
  .handler(async ({ data }) => {
    const { requireActiveMember } = await import("@/lib/member-session.server");
    const { listMemberPurchases } = await import("@/lib/member.server");
    const member = await requireActiveMember(data.token);
    return { member, purchases: await listMemberPurchases(member.id) };
  });

/** Creates a pending purchase and starts the online payment. */
export const startPurchase = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; productId: string; quantity?: number; callbackUrl: string }) => {
    if (!input?.productId) throw new Error("Please choose a product.");
    if (!input?.callbackUrl?.startsWith("http")) throw new Error("Invalid callback URL.");
    return {
      token: input.token ?? "",
      productId: input.productId,
      quantity: Math.min(100000, Math.max(1, Number(input.quantity) || 1)),
      callbackUrl: input.callbackUrl,
    };
  })
  .handler(async ({ data }) => {
    const { requireActiveMember } = await import("@/lib/member-session.server");
    const { createPurchase, startPaystackForPurchase } = await import("@/lib/member.server");
    const member = await requireActiveMember(data.token);
    const { purchase } = await createPurchase(member.id, data.productId, data.quantity);
    return startPaystackForPurchase({
      purchaseId: purchase.id,
      email: member.school_email,
      callbackUrl: data.callbackUrl,
    });
  });

/** Server-side payment verification — the only way a purchase becomes paid. */
export const verifyPurchasePayment = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; reference: string }) => {
    if (!input?.reference) throw new Error("A payment reference is required.");
    return { token: input.token ?? "", reference: input.reference };
  })
  .handler(async ({ data }) => {
    const { requireActiveMember } = await import("@/lib/member-session.server");
    const { verifyPaystackReference, applyPurchaseResult } = await import("@/lib/member.server");
    const member = await requireActiveMember(data.token);
    const result = await verifyPaystackReference(data.reference);
    const applied = await applyPurchaseResult({
      reference: data.reference,
      succeeded: result.status === "success",
      channel: result.channel ?? null,
      paidAt: result.paid_at ?? null,
    });
    return { status: result.status, memberId: member.id, ...applied };
  });

/** Authorized, time-limited download link for a paid digital product. */
export const getProductDownload = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; purchaseId: string }) => {
    if (!input?.purchaseId) throw new Error("A purchase is required.");
    return { token: input.token ?? "", purchaseId: input.purchaseId };
  })
  .handler(async ({ data }) => {
    const { requireActiveMember } = await import("@/lib/member-session.server");
    const { signProductDownload } = await import("@/lib/member.server");
    const member = await requireActiveMember(data.token);
    return signProductDownload(member.id, data.purchaseId);
  });
