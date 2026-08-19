import { createFileRoute } from "@tanstack/react-router";

import { BuyFlow } from "@/components/member/buy-flow";

export const Route = createFileRoute("/buy/prediction")({
  head: () => ({
    meta: [
      { title: "Buy BECE Prediction | Hills Examination Board" },
      {
        name: "description",
        content:
          "Members enter their Serial Number and PIN to buy BECE prediction packages and download them after payment.",
      },
      { property: "og:title", content: "Buy BECE Prediction — Hills Examination Board" },
      {
        property: "og:description",
        content: "Purchase BECE prediction packages with your membership Serial Number and PIN.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <BuyFlow
      type="prediction"
      title="Buy Prediction"
      intro="Verify your membership, then choose the prediction package you want. Downloads unlock once payment is verified."
    />
  ),
});
