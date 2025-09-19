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
      // Generate settings file
      const { settings } = await req.json();
      
      // Fetch all necessary data for the cart
      const [configResult, upsellsResult, addonsResult] = await Promise.all([
        supabase.from('shop_configurations').select('*').eq('shop_domain', shopDomain).single(),
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

      return new Response(
        JSON.stringify({ 
          success: true, 
          settingsJS,
          timestamp: new Date().toISOString(),
          message: 'Settings file generated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Return current settings as JS file
      const { data: config } = await supabase
        .from('shop_configurations')
        .select('*')
        .eq('shop_domain', shopDomain)
        .single();

      if (!config) {
        // Return default settings
        const defaultSettingsJS = `
window.STICKY_CART_SETTINGS = {
  enabled: true,
  cartDrawerEnabled: true,
  drawerPosition: 'right',
  themeColor: '#3B82F6',
  stickyButton: {
    enabled: true,
    text: 'Cart',
    position: 'bottom-right'
  },
  freeShipping: { enabled: false, threshold: 50 },
  upsells: { enabled: false },
  addOns: { enabled: false },
  discountBar: { enabled: false, code: '' },
  announcementText: '',
  currency: 'USD'
};
window.STICKY_CART_UPSELLS = [];
window.STICKY_CART_ADDONS = [];
window.STICKY_CART_SETTINGS_LOADED = Date.now();
`;
        return new Response(defaultSettingsJS, {
          headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
        });
      }

      // Use existing settings
      const settings = config.settings || {};
      const [upsellsResult, addonsResult] = await Promise.all([
        supabase.from('upsell_products').select('*').eq('shop_domain', shopDomain).eq('is_active', true).order('display_order'),
        supabase.from('addon_products').select('*').eq('shop_domain', shopDomain).eq('is_active', true).order('display_order')
      ]);

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
        
        upsells: { enabled: settings.upsellsEnabled === true },
        addOns: { enabled: settings.addOnsEnabled === true },
        discountBar: {
          enabled: settings.discountBarEnabled === true || settings.discountPromoEnabled === true,
          code: settings.discountCode || ''
        },
        
        announcementText: settings.announcementText || '',
        currency: settings.currency || 'USD'
      };

      const settingsJS = `
// Auto-generated cart settings
// Generated: ${new Date().toISOString()}
window.STICKY_CART_SETTINGS = ${JSON.stringify(normalizedSettings, null, 2)};
window.STICKY_CART_UPSELLS = ${JSON.stringify(upsellsResult.data || [], null, 2)};
window.STICKY_CART_ADDONS = ${JSON.stringify(addonsResult.data || [], null, 2)};
window.STICKY_CART_SETTINGS_LOADED = Date.now();
`;

      return new Response(settingsJS, {
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cart settings generator error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});