import { type LoaderFunctionArgs } from "@remix-run/node";
import { readFileSync } from "fs";
import { join } from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get('shop') || request.headers.get('x-forwarded-host');
    
    if (!shopDomain || !shopDomain.endsWith('.myshopify.com')) {
      return new Response('Invalid shop domain', { status: 400 });
    }

    // Read the cart-drawer.js file
    const cartDrawerPath = join(process.cwd(), 'app', 'assets', 'cart-drawer.js');
    let cartDrawerContent;
    
    try {
      cartDrawerContent = readFileSync(cartDrawerPath, 'utf8');
    } catch (error) {
      console.error('Failed to read cart-drawer.js:', error);
      return new Response('// Cart drawer script not found\nconsole.error("Sticky Cart: Script not found");', { 
        status: 200,
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    // Inject shop domain into the script
    const modifiedContent = `
// Sticky Cart Drawer Script for ${shopDomain}
(function() {
  'use strict';
  
  // Set shop domain globally
  window.STICKY_CART_SHOP_DOMAIN = '${shopDomain}';
  
  // Ensure we're on the storefront
  if (!window.location.hostname.endsWith('.myshopify.com')) {
    console.warn('Sticky Cart: Not on Shopify storefront');
    return;
  }
  
  // Prevent multiple initializations
  if (window.stickyCartDrawerLoaded) {
    console.log('Sticky Cart: Already loaded');
    return;
  }
  window.stickyCartDrawerLoaded = true;
  
  ${cartDrawerContent}
})();
`;

    return new Response(modifiedContent, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'Access-Control-Allow-Origin': `https://${shopDomain}`,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'content-type, x-shop-domain',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Proxy script error:', error);
    return new Response(`// Error loading cart drawer\nconsole.error('Sticky Cart: ${error.message}');`, { 
      status: 200,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
};

export default function ProxyScript() {
  return null;
}