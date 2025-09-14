import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || 'default-shop.myshopify.com';

    if (req.method === 'GET') {
      // Get shop configuration
      const { data: config, error } = await supabaseClient
        .from('shop_configurations')
        .select('*')
        .eq('shop_domain', shopDomain)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error('Error fetching config:', error);
        throw error;
      }

      // Return default config if none exists
      const defaultConfig = {
        enabled: true,
        sticky_button_enabled: true,
        sticky_button_text: "Cart",
        sticky_button_position: "bottom-right",
        theme_color: "#000000",
        free_shipping_enabled: true,
        free_shipping_threshold: 50,
        upsells_enabled: false,
        upsell_products: [],
        addons_enabled: false,
        addon_products: [],
        discount_bar_enabled: false,
        discount_code: "",
        announcement_enabled: false,
        announcement_text: ""
      };

      return new Response(JSON.stringify({
        settings: config?.settings || defaultConfig,
        subscription_status: config?.subscription_status || 'trial',
        subscription_plan: config?.subscription_plan || 'starter'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Save shop configuration
      const { settings } = await req.json();

      const { data, error } = await supabaseClient
        .from('shop_configurations')
        .upsert({
          shop_domain: shopDomain,
          settings: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_domain'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving config:', error);
        throw error;
      }

      console.log('Configuration saved for shop:', shopDomain);

      return new Response(JSON.stringify({ 
        success: true, 
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
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});