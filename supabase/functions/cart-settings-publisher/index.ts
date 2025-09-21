import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shop-domain',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopDomain = req.headers.get('x-shop-domain');
    if (!shopDomain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Shop domain required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { settings } = await req.json();
      
      // Fetch upsells and addons
      const [upsellsResult, addonsResult] = await Promise.all([
        supabase.from('upsell_products').select('*').eq('shop_domain', shopDomain).eq('is_active', true).order('display_order'),
        supabase.from('addon_products').select('*').eq('shop_domain', shopDomain).eq('is_active', true).order('display_order')
      ]);

      // Normalize settings
      const normalizedSettings = {
        enabled: settings.cartDrawerEnabled !== false,
        cartDrawerEnabled: settings.cartDrawerEnabled !== false,
        drawerPosition: settings.drawerPosition || 'right',
        themeColor: settings.themeColor || '#3B82F6',
        
        stickyButton: {
          enabled: settings.stickyButtonEnabled !== false,
          text: settings.stickyButtonText || settings.buttonText || 'Cart',
          position: settings.stickyButtonPosition || settings.buttonPosition || 'bottom-right'
        },
        
        freeShipping: {
          enabled: settings.freeShippingEnabled === true || settings.freeShippingBarEnabled === true,
          threshold: settings.freeShippingThreshold || 50
        },
        
        upsells: {
          enabled: settings.upsellsEnabled === true
        },
        
        addOns: {
          enabled: settings.addOnsEnabled === true
        },
        
        discountBar: {
          enabled: settings.discountBarEnabled === true || settings.discountPromoEnabled === true,
          code: settings.discountCode || ''
        },
        
        announcementText: settings.announcementText || '',
        currency: settings.currency || 'USD'
      };

      // Generate the settings JavaScript file content
      const settingsJS = `
// Auto-generated cart settings - Do not edit manually
// Generated: ${new Date().toISOString()}
// Shop: ${shopDomain}

window.STICKY_CART_SETTINGS = ${JSON.stringify(normalizedSettings, null, 2)};

window.STICKY_CART_UPSELLS = ${JSON.stringify(upsellsResult.data || [], null, 2)};

window.STICKY_CART_ADDONS = ${JSON.stringify(addonsResult.data || [], null, 2)};

// Settings loaded timestamp
window.STICKY_CART_SETTINGS_LOADED = Date.now();

console.log('[Sticky Cart] Settings loaded from local file:', window.STICKY_CART_SETTINGS);
      `;

      // Upload to storage (JS and JSON)
      const fileName = `${shopDomain}/settings.js`;
      const { error: uploadJsError } = await supabase.storage
        .from('cart-settings')
        .upload(fileName, new Blob([settingsJS], { type: 'application/javascript' }), {
          upsert: true,
          contentType: 'application/javascript'
        });

      if (uploadJsError) {
        console.error('Storage upload error (JS):', uploadJsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to upload settings JS file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also publish a JSON version for environments where executing scripts is restricted
      const jsonFileName = `${shopDomain}/settings.json`;
      const settingsJSON = JSON.stringify({
        shop: shopDomain,
        generatedAt: new Date().toISOString(),
        settings: normalizedSettings,
        upsells: upsellsResult.data || [],
        addons: addonsResult.data || []
      }, null, 2);

      const { error: uploadJsonError } = await supabase.storage
        .from('cart-settings')
        .upload(jsonFileName, new Blob([settingsJSON], { type: 'application/json' }), {
          upsert: true,
          contentType: 'application/json'
        });

      if (uploadJsonError) {
        console.error('Storage upload error (JSON):', uploadJsonError);
        // Do not fail the whole request if JSON fails; continue
      }

      console.log(`[Cart Settings Publisher] Published settings for ${shopDomain}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          fileName,
          jsonFileName,
          timestamp: new Date().toISOString(),
          message: 'Settings files published successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cart settings publisher error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});