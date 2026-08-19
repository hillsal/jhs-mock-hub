import { createFileRoute } from "@tanstack/react-router";

import { BuyFlow } from "@/components/member/buy-flow";

export const Route = createFileRoute("/buy/provision")({
  head: () => ({
    meta: [
      { title: "Buy Provisions & Materials | Hills Examination Board" },
      {
        name: "description",
        content:
          "Members enter their Serial Number and PIN to buy examination provisions, materials and training resources.",
      },
      { property: "og:title", content: "Buy Provisions — Hills Examination Board" },
      {
        property: "og:description",
        content: "Examination provisions and materials for registered Hills Examination Board members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <BuyFlow
      type="provision"
      title="Buy Provision"
      intro="Verify your membership, choose the provisions you need, then checkout securely online."
    />
  ),
});
