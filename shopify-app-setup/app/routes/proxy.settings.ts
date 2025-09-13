import { json, type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // In production, verify the app proxy signature here.
  const settings = {
    enabled: true,
    stickyButton: { enabled: true, text: "Cart", position: "bottom-right" },
    freeShipping: { enabled: true, threshold: 50 },
    upsells: { enabled: false },
    addOns: { enabled: false },
    discountBar: { enabled: false },
  };

  return json(settings, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
};

export default function ProxySettings() {
  return null;
}
