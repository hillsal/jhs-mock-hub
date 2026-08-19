import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ProductValues } from "@/lib/member.schemas";

/** Throws unless the caller holds the admin role. */
export async function requireAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export async function listMembersWithStats(search: string) {
  let query = supabaseAdmin
    .from("schools")
    .select(
      "id, school_name, contact_person, school_phone, school_email, membership_id, membership_status, mock_candidates, total_jhs_students, academic_year, region, district, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (search) {
    query = query.or(
      `school_name.ilike.%${search}%,membership_id.ilike.%${search}%,school_email.ilike.%${search}%,contact_person.ilike.%${search}%`,
    );
  }
  const { data: members, error } = await query;
  if (error) throw new Error(error.message);

  const { data: purchases } = await supabaseAdmin
    .from("purchases")
    .select("member_id, amount, payment_status");

  return (members ?? []).map((member) => {
    const mine = (purchases ?? []).filter((p) => p.member_id === member.id);
    const paid = mine.filter((p) => p.payment_status === "successful");
    return {
      ...member,
      totalPurchases: paid.length,
      totalSpent: paid.reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });
}

export async function setMemberStatus(memberId: string, status: string) {
  const { error } = await supabaseAdmin
    .from("schools")
    .update({ membership_status: status })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function resetMemberPin(memberId: string) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const pin = String((bytes[0] ?? 0) % 1_000_000).padStart(6, "0");
  const { error } = await supabaseAdmin.rpc("set_member_pin", {
    _member_id: memberId,
    _pin: pin,
  });
  if (error) throw new Error(error.message);
  return { pin };
}

export async function listAllPurchases(memberId?: string) {
  let query = supabaseAdmin
    .from("purchases")
    .select(
      "id, amount, currency, quantity, payment_status, purchased_at, created_at, transaction_reference, schools(school_name, membership_id), products(name, product_type)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAllProducts() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("product_type")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveProduct(input: ProductValues) {
  const row = {
    name: input.name,
    product_type: input.productType,
    description: input.description || null,
    price: input.price,
    pricing_mode: input.pricingMode,
    academic_year: input.academicYear || null,
    subject: input.subject || null,
    file_path: input.filePath || null,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await supabaseAdmin.from("products").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }
  const { data, error } = await supabaseAdmin.from("products").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}
