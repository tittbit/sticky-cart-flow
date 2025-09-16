import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { supabase } from "~/lib/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get('shop') || request.headers.get('x-forwarded-host');
    
    if (!shopDomain) {
      return json({ error: 'Shop domain required' }, { status: 400 });
    }

    // Load settings from Supabase instead of hardcoded values
    const { data, error } = await supabase
      .from('shop_configurations')
      .select('settings')
      .eq('shop_domain', shopDomain)
      .single();

    let settings;
    if (error || !data) {
      // Default settings if none found
      settings = {
        enabled: true,
        stickyButton: { enabled: true, text: "Cart", position: "bottom-right" },
        freeShipping: { enabled: true, threshold: 50 },
        upsells: { enabled: false },
        addOns: { enabled: false },
        discountBar: { enabled: false },
      };
    } else {
      settings = {
        enabled: data.settings.cartDrawerEnabled || true,
        stickyButton: { 
          enabled: data.settings.stickyButtonEnabled || true, 
          text: data.settings.stickyButtonText || "Cart", 
          position: data.settings.stickyButtonPosition || "bottom-right" 
        },
        freeShipping: { 
          enabled: data.settings.freeShippingEnabled || true, 
          threshold: data.settings.freeShippingThreshold || 50 
        },
        upsells: { enabled: data.settings.upsellsEnabled || false },
        addOns: { enabled: data.settings.addOnsEnabled || false },
        discountBar: { enabled: data.settings.discountBarEnabled || false },
        themeColor: data.settings.themeColor || '#000000',
        currency: data.settings.currency || 'USD'
      };
    }

    return json(settings, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error('Proxy settings error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function ProxySettings() {
  return null;
}
