import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');

    if (!shop) {
      throw new Error('Shop parameter is required');
    }

    // Get shop settings
    const { data: settings, error } = await supabaseClient
      .from('shop_configurations')
      .select('*')
      .eq('shop_domain', shop)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Return default settings if no custom settings found
    const defaultSettings = {
      enabled: true,
      stickyButton: {
        enabled: true,
        position: 'bottom-right',
        text: 'Cart',
        showCount: true,
        backgroundColor: '#000000',
        textColor: '#ffffff'
      },
      cartDrawer: {
        enabled: true,
        position: 'right',
        width: '400px',
        showProductImages: true,
        showQuantitySelector: true,
        showRemoveButton: true
      },
      freeShipping: {
        enabled: false,
        threshold: 100,
        message: 'Free shipping on orders over $100!'
      },
      upsells: {
        enabled: false,
        products: []
      },
      addons: {
        enabled: false,
        products: []
      },
      analytics: {
        enabled: false,
        googleAnalyticsId: null,
        facebookPixelId: null
      }
    };

    const responseData = settings ? {
      ...defaultSettings,
      ...(typeof settings.settings === 'object' ? settings.settings : {})
    } : defaultSettings;

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error fetching shop config:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        enabled: false // Fail safely
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});