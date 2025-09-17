import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
    
    if (!shopDomain) {
      return new Response(JSON.stringify({ error: 'Shop domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get shop configuration
      const { data: config, error } = await supabase
        .from('shop_configurations')
        .select('*')
        .eq('shop_domain', shopDomain)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch configuration' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return default config if none exists
      const defaultConfig = {
        cartDrawerEnabled: true,
        stickyButtonEnabled: true,
        drawerPosition: 'right',
        themeColor: '#000000',
        stickyButtonText: 'Cart',
        stickyButtonPosition: 'bottom-right',
        freeShippingEnabled: false,
        freeShippingThreshold: 50,
        upsellsEnabled: false,
        addOnsEnabled: false,
        discountBarEnabled: false,
        announcementText: '',
        discountCode: '',
        storefrontCurrency: 'USD' // Default currency
      };

      // Merge DB settings with defaults then normalize keys to canonical shape
      const rawSettings = config ? { ...defaultConfig, ...(config.settings || {}) } : defaultConfig;

      const normalized = {
        cartDrawerEnabled: rawSettings.cartDrawerEnabled ?? rawSettings.enabled ?? true,
        drawerPosition: rawSettings.drawerPosition || rawSettings.cartDrawerPosition || 'right',
        themeColor: rawSettings.themeColor || '#000000',

        // Sticky button
        stickyButtonEnabled: rawSettings.stickyButtonEnabled ?? rawSettings.stickyButton?.enabled ?? true,
        stickyButtonText: rawSettings.stickyButtonText || rawSettings.buttonText || rawSettings.stickyButton?.text || 'Cart',
        stickyButtonPosition: rawSettings.stickyButtonPosition || rawSettings.buttonPosition || rawSettings.stickyButton?.position || 'bottom-right',

        // Free shipping
        freeShippingEnabled: rawSettings.freeShippingEnabled ?? rawSettings.freeShippingBarEnabled ?? rawSettings.freeShipping?.enabled ?? false,
        freeShippingThreshold: Number(rawSettings.freeShippingThreshold ?? rawSettings.freeShipping?.threshold ?? 50),

        // Features
        upsellsEnabled: rawSettings.upsellsEnabled ?? rawSettings.upsells?.enabled ?? false,
        addOnsEnabled: rawSettings.addOnsEnabled ?? rawSettings.addOns?.enabled ?? false,
        discountBarEnabled: rawSettings.discountBarEnabled ?? rawSettings.discountPromoEnabled ?? rawSettings.discountBar?.enabled ?? false,
        announcementText: rawSettings.announcementText || '',
        discountCode: rawSettings.discountCode || '',
        storefrontCurrency: rawSettings.storefrontCurrency || 'USD'
      };

      // Get upsell products if upsells are enabled
      let upsellProducts = [];
      if (normalized.upsellsEnabled) {
        const { data: upsells } = await supabase
          .from('upsell_products')
          .select('*')
          .eq('shop_domain', shopDomain)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        upsellProducts = upsells || [];
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        settings: normalized,
        upsellProducts,
        subscription: {
          status: config?.subscription_status || 'trial',
          plan: config?.subscription_plan || 'starter',
          trialEndsAt: config?.trial_ends_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Save shop configuration
      const { settings } = await req.json();
      
      if (!settings) {
        return new Response(JSON.stringify({ error: 'Settings are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upsert configuration
      const { data, error } = await supabase
        .from('shop_configurations')
        .upsert({
          shop_domain: shopDomain,
          settings: settings
        }, {
          onConflict: 'shop_domain'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving config:', error);
        return new Response(JSON.stringify({ error: 'Failed to save configuration' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Configuration saved successfully',
        data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in shop-config function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
