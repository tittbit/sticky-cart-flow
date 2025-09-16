// Utility helpers for determining the active shop domain used across the app
export const getShopDomain = (): string => {
  // Prefer an explicit domain saved by the admin UI
  const saved = (typeof window !== 'undefined') ? localStorage.getItem('shop_domain') : null;
  if (saved && saved.trim()) return saved.trim();

  // Shopify storefront context
  const shopifyShop = (typeof window !== 'undefined') ? (window as any)?.Shopify?.shop : undefined;
  if (shopifyShop && typeof shopifyShop === 'string') return shopifyShop;

  // Fallback for preview/demo
  return 'demo-shop.myshopify.com';
};
