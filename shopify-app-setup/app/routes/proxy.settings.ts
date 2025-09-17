import { type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get('shop') || request.headers.get('x-forwarded-host');
    
    if (!shopDomain || !shopDomain.endsWith('.myshopify.com')) {
      return new Response('Invalid shop domain', { status: 400 });
    }

    // Return default settings for now - this would typically fetch from database
    const settings = {
      enabled: true,
      stickyButton: {
        enabled: true,
        position: 'bottom-right'
      },
      themeColor: '#000000',
      freeShipping: {
        enabled: true,
        threshold: 50
      }
    };

    return new Response(JSON.stringify(settings), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': `https://${shopDomain}`,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'content-type, x-shop-domain',
      },
    });
  } catch (error) {
    console.error('Settings proxy error:', error);
    return new Response(JSON.stringify({ 
      enabled: true, 
      stickyButton: { enabled: true, position: 'bottom-right' },
      themeColor: '#000000'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export default function ProxySettings() {
  return null;
}