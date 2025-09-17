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
      console.log('Fetching add-ons for:', shopDomain);
      const { data: products, error } = await supabase
        .from('addon_products')
        .select('*')
        .eq('shop_domain', shopDomain)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Database fetch error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch add-ons' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, products: products || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Add/update add-on products
      const { products } = await req.json();
      
      if (!products || !Array.isArray(products)) {
        console.log('Invalid products payload:', products);
        return new Response(JSON.stringify({ error: 'Products array is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Saving ${products.length} addon products for ${shopDomain}`);
      
      // Validate all products have required fields
      const invalidProducts = products.filter(p => 
        !p.product_title?.trim() || !p.product_handle?.trim() || typeof p.product_price !== 'number'
      );
      
      if (invalidProducts.length > 0) {
        console.log('Invalid products found:', invalidProducts);
        return new Response(JSON.stringify({ 
          error: 'All products must have title, handle, and valid price' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Use transactional replace function to prevent data loss
      const { error } = await supabase.rpc('replace_addon_products', {
        p_shop_domain: shopDomain,
        p_products: JSON.stringify(products)
      });

      if (error) {
        console.error('Error saving add-ons:', error);
        return new Response(JSON.stringify({ error: 'Failed to save add-ons' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Add-ons updated successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in add-ons function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
