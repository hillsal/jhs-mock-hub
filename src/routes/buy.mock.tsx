import { createFileRoute } from "@tanstack/react-router";

import { BuyFlow } from "@/components/member/buy-flow";

export const Route = createFileRoute("/buy/mock")({
  head: () => ({
    meta: [
      { title: "Buy Mock Examination | Hills Examination Board" },
      {
        name: "description",
        content:
          "Members enter their Serial Number and PIN to buy Hills Examination Board mock examinations online.",
      },
      { property: "og:title", content: "Buy Mock Examination — Hills Examination Board" },
      {
        property: "og:description",
        content: "Use your membership Serial Number and PIN to purchase a mock examination.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <BuyFlow
      type="mock"
      title="Buy Mock"
      intro="Enter your Serial Number and PIN to continue, then choose the mock examination you want to purchase."
    />
  ),
});
