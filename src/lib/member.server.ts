import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ProductType = "mock" | "prediction" | "provision" | "training" | "other";

import type { RegisterMemberValues } from "@/lib/member.schemas";

export type RegisterMemberInput = RegisterMemberValues;

function randomPin() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String((bytes[0] ?? 0) % 1_000_000).padStart(6, "0");
}

/** Creates the permanent member account and returns its Serial Number + PIN. */
export async function registerMember(input: RegisterMemberInput) {
  const { data: existing } = await supabaseAdmin
    .from("schools")
    .select("id")
    .ilike("school_email", input.email)
    .maybeSingle();
  if (existing) {
    throw new Error(
      "A membership already exists for this email address. Use your Serial Number and PIN instead.",
    );
  }

  const { data: member, error } = await supabaseAdmin
    .from("schools")
    .insert({
      school_name: input.organizationName,
      school_type: input.schoolType || "Private JHS",
      contact_person: input.contactPerson,
      school_phone: input.phone,
      whatsapp_number: input.whatsapp || null,
      school_email: input.email.toLowerCase(),
      region: input.region,
      district: input.district,
      school_address: input.address || null,
      mock_candidates: input.candidates,
      total_jhs_students: input.students,
      academic_year: input.academicYear,
      membership_status: "active",
    })
    .select("id, membership_id, school_name")
    .single();
  if (error) throw new Error(error.message);

  const pin = randomPin();
  const { error: pinError } = await supabaseAdmin.rpc("set_member_pin", {
    _member_id: member.id,
    _pin: pin,
  });
  if (pinError) throw new Error(pinError.message);

  return { membershipId: member.membership_id, pin, memberName: member.school_name };
}

const MAX_FAILED_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MINUTES = 15;

/** Verifies Serial Number + PIN with basic rate limiting. */
export async function verifyMemberCredentials(membershipId: string, pin: string) {
  const serial = membershipId.trim().toUpperCase();
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await supabaseAdmin
    .from("member_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("membership_id", serial)
    .eq("succeeded", false)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILED_ATTEMPTS) {
    throw new Error("Too many failed attempts. Please try again in 15 minutes.");
  }

  const { data, error } = await supabaseAdmin.rpc("verify_member_credentials", {
    _membership_id: serial,
    _pin: pin,
  });
  if (error) throw new Error(error.message);
  const member = Array.isArray(data) ? data[0] : null;

  await supabaseAdmin
    .from("member_login_attempts")
    .insert({ membership_id: serial, succeeded: !!member });

  if (!member) throw new Error("Serial Number or PIN is incorrect.");
  if (member.membership_status === "suspended") {
    throw new Error("Your membership is currently suspended. Please contact the administrator.");
  }
  if (member.membership_status === "expired") {
    throw new Error("Your membership has expired. Please contact the administrator to renew.");
  }
  return member as { id: string; school_name: string; membership_id: string; membership_status: string };
}

export async function listProducts(type?: ProductType) {
  let query = supabaseAdmin
    .from("products")
    .select("id, name, product_type, description, price, pricing_mode, academic_year, subject")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (type) query = query.eq("product_type", type);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Creates a pending purchase; the amount is always computed server-side. */
export async function createPurchase(memberId: string, productId: string, quantity: number) {
  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("id, name, price, pricing_mode, is_active")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!product || !product.is_active) throw new Error("That product is unavailable.");

  const qty = product.pricing_mode === "per_candidate" ? Math.max(1, quantity) : 1;
  const amount = Number((Number(product.price) * qty).toFixed(2));

  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from("purchases")
    .insert({
      member_id: memberId,
      product_id: product.id,
      quantity: qty,
      amount,
      payment_status: "pending",
    })
    .select("id, amount, currency")
    .single();
  if (purchaseError) throw new Error(purchaseError.message);
  return { purchase, productName: product.name };
}

export async function startPaystackForPurchase(params: {
  purchaseId: string;
  email: string;
  callbackUrl: string;
}) {
  const secretKey = process.env["PAYSTACK_SECRET_KEY"];
  if (!secretKey) {
    throw new Error("Online payment is not configured yet. Please contact the administrator.");
  }

  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id, amount, currency, payment_status")
    .eq("id", params.purchaseId)
    .maybeSingle();
  if (!purchase) throw new Error("Purchase not found.");
  if (purchase.payment_status === "successful") throw new Error("This purchase is already paid.");

  const reference = `HEB-PUR-${purchase.id.slice(0, 8)}-${Date.now()}`;
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(Number(purchase.amount) * 100),
      currency: purchase.currency || "GHS",
      reference,
      callback_url: params.callbackUrl,
      metadata: { purchase_id: purchase.id },
    }),
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url: string; reference: string };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Could not start the payment.");
  }

  await supabaseAdmin
    .from("purchases")
    .update({ transaction_reference: json.data.reference })
    .eq("id", purchase.id);

  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
}

/** Applies a verified Paystack outcome to a purchase. Idempotent. */
export async function applyPurchaseResult(params: {
  reference: string;
  succeeded: boolean;
  channel?: string | null;
  paidAt?: string | null;
}) {
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("id, member_id, payment_status")
    .eq("transaction_reference", params.reference)
    .maybeSingle();
  if (!purchase) return { found: false as const };

  await supabaseAdmin
    .from("purchases")
    .update({
      payment_status: params.succeeded ? "successful" : "failed",
      payment_channel: params.channel ?? null,
      purchased_at: params.succeeded ? (params.paidAt ?? new Date().toISOString()) : null,
      access_expires_at: params.succeeded
        ? new Date(Date.now() + 365 * 86_400_000).toISOString()
        : null,
    })
    .eq("id", purchase.id);

  return { found: true as const, paid: params.succeeded, purchaseId: purchase.id };
}

/** Verifies a reference directly with Paystack. */
export async function verifyPaystackReference(reference: string) {
  const secretKey = process.env["PAYSTACK_SECRET_KEY"];
  if (!secretKey) throw new Error("Online payment is not configured yet.");
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { status: string; channel?: string; paid_at?: string };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Could not verify this payment.");
  }
  return json.data;
}

export async function listMemberPurchases(memberId: string) {
  const { data, error } = await supabaseAdmin
    .from("purchases")
    .select(
      "id, amount, currency, quantity, payment_status, purchased_at, access_expires_at, created_at, transaction_reference, products(id, name, product_type, file_path)",
    )
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Time-limited signed URL for a paid digital product. */
export async function signProductDownload(memberId: string, purchaseId: string) {
  const { data: purchase, error } = await supabaseAdmin
    .from("purchases")
    .select("id, member_id, payment_status, access_expires_at, products(name, file_path)")
    .eq("id", purchaseId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!purchase) throw new Error("Purchase not found.");
  if (purchase.payment_status !== "successful") throw new Error("This purchase is not paid yet.");
  if (purchase.access_expires_at && new Date(purchase.access_expires_at) < new Date()) {
    throw new Error("Access to this product has expired.");
  }
  const filePath = (purchase.products as { file_path: string | null } | null)?.file_path;
  if (!filePath) throw new Error("This product has no file to download yet.");

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from("predictions")
    .createSignedUrl(filePath, 300);
  if (signError || !signed) throw new Error(signError?.message ?? "Could not prepare the download.");
  return { url: signed.signedUrl };
}
