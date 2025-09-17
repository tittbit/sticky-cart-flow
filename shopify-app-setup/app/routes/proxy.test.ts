import { type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get('shop') || request.headers.get('x-forwarded-host');
  
  const testResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    shopDomain,
    message: 'App proxy is working correctly!',
    requestUrl: request.url,
    headers: Object.fromEntries(request.headers.entries())
  };

  return new Response(JSON.stringify(testResponse, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': shopDomain ? `https://${shopDomain}` : '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'content-type, x-shop-domain',
    },
  });
};

export default function ProxyTest() {
  return null;
}
