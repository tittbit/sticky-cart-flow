# Updated Setup Notes (Post-Deployment)

These are the incremental changes you asked for. Highlights:
- Functions now expect the shop domain via `x-shop-domain` header for all GET/POST.
- Dashboard, Preview, and Sticky Button load and save with that header.
- Live preview updates instantly after saving settings.
- Storefront script intercepts Add to Cart more reliably and pulls settings from Supabase with `x-shop-domain`.
- Currency respects the shop’s storefront currency when available.

Quick checklist:
1) Make sure the Theme App Embed is enabled (required to inject the storefront script), but do not manage settings there. Settings are controlled exclusively from the dashboard (Supabase).
2) In the app dashboard, set the shop once. It is stored in localStorage key `shop_domain`. You can also change it by running in your browser console: `localStorage.setItem('shop_domain', 'your-shop.myshopify.com')` and reloading the admin.
3) Verify analytics and shop-config requests include `x-shop-domain` in DevTools network tab.
4) If your storefront still opens the native cart, confirm the embed is enabled and the integration script is present on product pages.

No other secrets or env changes are required.
