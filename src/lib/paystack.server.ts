import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Applies a verified Paystack outcome: updates the payment + order and grants
 * prediction access on success. Idempotent — safe for webhook + callback both.
 */
export async function applyPaystackResult(params: {
  reference: string;
  succeeded: boolean;
  channel?: string | null;
  paidAt?: string | null;
}) {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, order_id, school_id, status")
    .eq("paystack_reference", params.reference)
    .maybeSingle();
  if (!payment) return { updated: false as const };

  await supabaseAdmin
    .from("payments")
    .update({
      status: params.succeeded ? "success" : "failed",
      channel: params.channel ?? null,
      paid_at: params.succeeded ? (params.paidAt ?? new Date().toISOString()) : null,
    })
    .eq("id", payment.id);

  if (!params.succeeded) return { updated: true as const, paid: false as const };

  const { data: order } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", payment.order_id)
    .select("id, school_id, product_id")
    .single();

  if (order) {
    const { data: product } = await supabaseAdmin
      .from("prediction_products")
      .select("validity_days")
      .eq("id", order.product_id)
      .maybeSingle();
    const validityDays = product?.validity_days ?? 90;
    const expiresAt = new Date(Date.now() + validityDays * 86_400_000).toISOString();

    await supabaseAdmin
      .from("prediction_access")
      .upsert(
        {
          order_id: order.id,
          school_id: order.school_id,
          product_id: order.product_id,
          is_active: true,
          expires_at: expiresAt,
        },
        { onConflict: "order_id" },
      );

    await supabaseAdmin
      .from("schools")
      .update({ membership_status: "active" })
      .eq("id", order.school_id);
  }

  return { updated: true as const, paid: true as const };
}
