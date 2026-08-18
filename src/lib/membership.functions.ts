import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreateOrderInput = {
  productId: string;
  candidateCount: number;
};

/**
 * Creates a pending order for the signed-in school.
 * Price is read from the database — never trusted from the client.
 */
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateOrderInput) => {
    if (!input?.productId) throw new Error("A prediction package is required.");
    const count = Number(input.candidateCount);
    if (!Number.isInteger(count) || count < 1 || count > 100000) {
      throw new Error("Invalid number of candidates.");
    }
    return { productId: input.productId, candidateCount: count };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_name, mock_candidates")
      .eq("user_id", userId)
      .maybeSingle();
    if (schoolError) throw new Error(schoolError.message);
    if (!school) throw new Error("No school registration found for this account.");

    const { data: product, error: productError } = await supabase
      .from("prediction_products")
      .select("id, name, price_per_candidate, min_candidates, max_candidates, mock_type_id, is_active")
      .eq("id", data.productId)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product || !product.is_active) throw new Error("That prediction package is unavailable.");

    if (data.candidateCount < product.min_candidates) {
      throw new Error(`This package requires at least ${product.min_candidates} candidates.`);
    }
    if (product.max_candidates && data.candidateCount > product.max_candidates) {
      throw new Error(`This package allows at most ${product.max_candidates} candidates.`);
    }

    const unitPrice = Number(product.price_per_candidate);
    // Flat pricing: a one-time GHS 200 membership registration fee is charged
    // only on a school's first order. The prediction price itself does not
    // depend on the number of candidates.
    const { data: priorOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("school_id", school.id)
      .limit(1);
    const registrationFee = (priorOrders?.length ?? 0) === 0 ? 200 : 0;
    const amount = Number((unitPrice + registrationFee).toFixed(2));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        school_id: school.id,
        product_id: product.id,
        mock_type_id: product.mock_type_id,
        candidate_count: data.candidateCount,
        unit_price: unitPrice,
        registration_fee: registrationFee,
        amount,
        payment_status: "pending",
      })
      .select("id, order_number, amount, currency, payment_status, registration_fee")
      .single();
    if (orderError) throw new Error(orderError.message);

    return order;
  });
