// Utility helpers for determining the active shop domain used across the app
export const getShopDomain = (): string => {
  // 1) URL ?shop= override (useful in preview/testing)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('shop');
    if (qp && qp.trim()) {
      const domain = qp.trim();
      localStorage.setItem('shop_domain', domain);
      return domain;
    }
  }

  // 2) Prefer an explicit domain saved by the admin UI
  const saved = (typeof window !== 'undefined') ? localStorage.getItem('shop_domain') : null;
  if (saved && saved.trim()) return saved.trim();

  // 3) Shopify storefront context or Liquid global
  const shopifyShop = (typeof window !== 'undefined') ? (window as any)?.Shopify?.shop : undefined;
  const liquidShop = (typeof window !== 'undefined') ? (window as any)?.SHOP_DOMAIN : undefined;
  if (shopifyShop && typeof shopifyShop === 'string') return shopifyShop;
  if (liquidShop && typeof liquidShop === 'string') return liquidShop;

  // 4) Fallback for preview/demo
  return 'demo-shop.myshopify.com';
};
