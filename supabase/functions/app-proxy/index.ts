// Supabase Edge Function: app-proxy
// Handles Shopify App Proxy endpoints: /test, /settings, /script

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function getDefaultSettings() {
  return {
    cartDrawerEnabled: true,
    stickyButtonEnabled: true,
    stickyButtonPosition: 'bottom-right',
    stickyButtonText: 'Cart',
    themeColor: '#000000',
    freeShippingEnabled: true,
    freeShippingThreshold: 50,
    upsellsEnabled: false,
    addOnsEnabled: false,
    discountBarEnabled: false,
    announcementText: '',
    drawerPosition: 'right'
  };
}

async function handleSettingsRequest(shopDomain: string) {
  try {
    console.log(`[app-proxy] Loading settings for shop: ${shopDomain}`);
    
    if (!shopDomain || !shopDomain.endsWith('.myshopify.com')) {
      return json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Fetch shop configuration from database
    const { data: config, error: configError } = await supabase
      .from('shop_configurations')
      .select('*')
      .eq('shop_domain', shopDomain)
      .maybeSingle();

    if (configError) {
      console.error('[app-proxy] Database error:', configError);
      return json({ settings: getDefaultSettings() }, { status: 200 });
    }

    let settings;
    if (config) {
      // Merge database settings with defaults
      const dbSettings = config.settings || {};
      settings = {
        ...getDefaultSettings(),
        ...dbSettings,
        subscriptionStatus: config.subscription_status || 'trial',
        subscriptionPlan: config.subscription_plan || 'starter'
      };
    } else {
      settings = getDefaultSettings();
    }

    console.log(`[app-proxy] Settings loaded for ${shopDomain}:`, settings);
    return json({ settings }, { 
      headers: { 'Cache-Control': 'public, max-age=60' } 
    });

  } catch (error) {
    console.error('[app-proxy] Error loading settings:', error);
    return json({ settings: getDefaultSettings() }, { status: 200 });
  }
}

// Load the enhanced cart drawer script from assets
async function loadCartDrawerScript() {
  try {
    // In production, this would read from the assets file
    // For now, return a reference to load via the shopify app proxy script endpoint
    return `
      (function() {
        console.log('[Sticky Cart] Loading enhanced cart drawer...');
        var script = document.createElement('script');
        script.src = window.location.origin + '/tools/cart-drawer/enhanced-script?shop=' + (window.STICKY_CART_SHOP_DOMAIN || window.location.hostname);
        script.onload = function() { console.log('[Sticky Cart] Enhanced script loaded'); };
        script.onerror = function() { console.error('[Sticky Cart] Failed to load enhanced script'); };
        document.head.appendChild(script);
      })();
    `;
  } catch (error) {
    console.error('[app-proxy] Error loading cart drawer script:', error);
    return `console.error('[Sticky Cart] Failed to load cart drawer');`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path')?.replace(/^\/+/, '') || '';
    const shop = url.searchParams.get('shop') || '';

    console.log(`[app-proxy] path="${path}" shop="${shop}"`);

    switch (path) {
      case 'test':
        return json({ 
          success: true, 
          message: 'App proxy is working', 
          shop, 
          ts: new Date().toISOString() 
        }, {
          headers: { 'Cache-Control': 'public, max-age=60' }
        });

      case 'settings':
        return await handleSettingsRequest(shop);

      case 'script':
        const scriptContent = await loadCartDrawerScript();
        return new Response(scriptContent, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            ...corsHeaders,
          },
        });

      case 'enhanced-script':
        // Serve the enhanced cart drawer script
        const enhancedScript = await fetch('https://sticky-cart-flow.vercel.app/shopify-app-setup/app/assets/cart-drawer.js')
          .then(res => res.text())
          .catch(() => 'console.error("[Sticky Cart] Could not load enhanced script");');
        
        // Inject the shop domain
        const injectedScript = `
          window.STICKY_CART_SHOP_DOMAIN = '${shop}';
          ${enhancedScript}
        `;
        
        return new Response(injectedScript, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            ...corsHeaders,
          },
        });

      default:
        return json({ error: 'Not Found', path }, { status: 404 });
    }
  } catch (error) {
    console.error('[app-proxy] Error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
});
