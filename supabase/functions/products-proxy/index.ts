import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Basic shop domain validation to prevent SSRF
function isValidShopDomain(domain: string | null): domain is string {
  if (!domain) return false;
  try {
    const d: string = domain.trim().toLowerCase();
    // Allow myshopify.com or custom domains with at least one dot
    return d.endsWith('.myshopify.com') || /.+\..+/.test(d);
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const shopParam = url.searchParams.get('shop');
    const shopHeader = req.headers.get('x-shop-domain');
    const shopDomain = shopParam || shopHeader;
    const apiKey = req.headers.get('x-shopify-api-key');

    if (!isValidShopDomain(shopDomain)) {
      return new Response(JSON.stringify({ error: 'Valid shop domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Shopify API key is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, q, handle } = await req.json().catch(() => ({}));

    if (action === 'search') {
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return new Response(JSON.stringify({ error: 'Query must be at least 2 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Use Shopify Admin API to search for products
      const adminApiUrl = `https://${shopDomain}/admin/api/2025-10/products.json?title=${encodeURIComponent(q)}`;

      const headers = {
        'Accept': 'application/json',
        'X-Shopify-Access-Token': apiKey,
      };

      console.log('Calling Admin API:', adminApiUrl);
      console.log('Admin API headers:', headers);

      const resp = await fetch(adminApiUrl, {
        headers: headers
      });

      if (!resp.ok) {
        console.error('Admin API endpoint failed', resp.status, await resp.text());
        return new Response(JSON.stringify({ error: 'Failed to search products' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await resp.json();
      const products = (data?.products || []).map((p: any) => ({
        id: String(p.id),
        title: p.title,
        handle: p.handle,
        price: Number(p.variants?.[0]?.price || 0),
        image: p.image?.src || null,
      }));

      return new Response(JSON.stringify({ success: true, products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'by_handle') {
      if (!handle || typeof handle !== 'string') {
        return new Response(JSON.stringify({ error: 'handle is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const prodUrl = `https://${shopDomain}/products/${encodeURIComponent(handle)}.json`;
      const resp = await fetch(prodUrl, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) {
        console.error('Product JSON failed', await resp.text());
        return new Response(JSON.stringify({ error: 'Failed to fetch product' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { product } = await resp.json();
      const firstVariant = product?.variants?.[0];
      const firstImage = product?.images?.[0]?.src || product?.image?.src || null;

      const formatted = {
        id: String(product?.id || ''),
        title: product?.title || '',
        handle: product?.handle || '',
        price: Number(firstVariant?.price || 0),
        image: firstImage,
      };

      return new Response(JSON.stringify({ success: true, product: formatted }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('products-proxy error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
