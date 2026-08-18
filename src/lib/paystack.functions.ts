import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Starts a Paystack transaction for a pending order that belongs to the
 * signed-in school. The amount always comes from the database (in pesewas).
 */
export const initializePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; callbackUrl: string }) => {
    if (!input?.orderId) throw new Error("An order is required.");
    if (!input?.callbackUrl?.startsWith("http")) throw new Error("Invalid callback URL.");
    return { orderId: input.orderId, callbackUrl: input.callbackUrl };
  })
  .handler(async ({ data, context }) => {
    const secretKey = process.env["PAYSTACK_SECRET_KEY"];
    if (!secretKey) throw new Error("Paystack is not configured yet.");

    const { supabase, userId } = context;

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_email, school_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (schoolError) throw new Error(schoolError.message);
    if (!school) throw new Error("No school registration found for this account.");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, amount, currency, payment_status, school_id")
      .eq("id", data.orderId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const reference = `HEB-${order.order_number}-${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: school.school_email,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency || "GHS",
        reference,
        callback_url: data.callbackUrl,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          school_id: school.id,
          school_name: school.school_name,
        },
      }),
    });

    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) {
      throw new Error(json.message || "Could not start the Paystack payment.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      school_id: school.id,
      amount: Number(order.amount),
      currency: order.currency || "GHS",
      paystack_reference: json.data.reference,
      status: "pending",
    });
    if (paymentError) throw new Error(paymentError.message);

    return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
  });

/**
 * Verifies a Paystack reference and, when successful, marks the order paid and
 * grants prediction access. Safe to call repeatedly (idempotent).
 */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string }) => {
    if (!input?.reference) throw new Error("A payment reference is required.");
    return { reference: input.reference };
  })
  .handler(async ({ data, context }) => {
    const secretKey = process.env["PAYSTACK_SECRET_KEY"];
    if (!secretKey) throw new Error("Paystack is not configured yet.");

    const { supabase, userId } = context;
    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!school) throw new Error("No school registration found for this account.");

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, school_id, status")
      .eq("paystack_reference", data.reference)
      .maybeSingle();
    if (!payment || payment.school_id !== school.id) throw new Error("Payment not found.");

    const succeeded = json.data.status === "success";
    const { applyPaystackResult } = await import("@/lib/paystack.server");
    await applyPaystackResult({
      reference: data.reference,
      succeeded,
      channel: json.data.channel ?? null,
      paidAt: json.data.paid_at ?? null,
    });

    return { status: succeeded ? "success" : json.data.status, orderId: payment.order_id };
  });
