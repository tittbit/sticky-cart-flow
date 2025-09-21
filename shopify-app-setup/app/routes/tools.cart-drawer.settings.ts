import { type LoaderFunctionArgs } from "@remix-run/node";

// Route: /tools/cart-drawer/settings
// Serves the published cart settings JS from Supabase Storage with the correct MIME type
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);

    // Prefer explicit ?shop= param, then Shopify proxy headers
    const shopParam = url.searchParams.get("shop");
    const shopHeader = request.headers.get("x-shopify-shop-domain")
      || request.headers.get("x-forwarded-host")
      || request.headers.get("x-forwarded-for");

    const shopDomain = (shopParam || shopHeader || "").trim();

    if (!shopDomain) {
      return new Response("Shop domain required", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Public URL to the published JS file in Supabase Storage
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://mjfzxmpscndznuaeoxft.supabase.co";
    const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/cart-settings/${shopDomain}/settings.js`;

    // Fetch the JS from storage and pass it through with correct MIME type
    try {
      const res = await fetch(storageUrl, { headers: { "Cache-Control": "no-cache" } });
      if (res.ok) {
        const js = await res.text();
        return new Response(js, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    } catch (err) {
      console.error("[Proxy Settings /tools/cart-drawer/settings] Failed to fetch storage file:", err);
    }

    // Fallback to safe defaults (JS, not JSON!) to avoid MIME issues
    const fallback = `
// Default cart settings fallback (Remix proxy at /tools/cart-drawer/settings)
window.STICKY_CART_SETTINGS = {
  enabled: true,
  cartDrawerEnabled: true,
  stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
  freeShipping: { enabled: false, threshold: 50 },
  upsells: { enabled: false },
  addOns: { enabled: false },
  discountBar: { enabled: false, code: '' },
  themeColor: '#3B82F6',
  currency: 'USD'
};
window.STICKY_CART_UPSELLS = [];
window.STICKY_CART_ADDONS = [];
window.STICKY_CART_SETTINGS_LOADED = Date.now();
console.log('[Sticky Cart] Default settings loaded via Remix proxy fallback');
`;

    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Proxy Settings /tools/cart-drawer/settings] Internal error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

export default function ToolsCartDrawerSettings() {
  return null;
}
