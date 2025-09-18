// Supabase Edge Function: app-proxy
// Handles Shopify App Proxy endpoints: /test, /settings, /script

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function getDefaultSettings() {
  return {
    cartDrawerEnabled: true,
    stickyButtonEnabled: true,
    stickyButtonPosition: 'bottom-right',
    stickyButtonText: 'Cart',
    themeColor: '#000000',
    freeShippingEnabled: true,
    freeShippingThreshold: 50,
    upsellsEnabled: false,
    addOnsEnabled: false,
    discountBarEnabled: false,
    announcementText: '',
    drawerPosition: 'right'
  };
}

async function handleSettingsRequest(shopDomain: string) {
  try {
    console.log(`[app-proxy] Loading settings for shop: ${shopDomain}`);
    
    if (!shopDomain || !shopDomain.endsWith('.myshopify.com')) {
      return json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Fetch shop configuration from database
    const { data: config, error: configError } = await supabase
      .from('shop_configurations')
      .select('*')
      .eq('shop_domain', shopDomain)
      .maybeSingle();

    if (configError) {
      console.error('[app-proxy] Database error:', configError);
      return json({ settings: getDefaultSettings() }, { status: 200 });
    }

    let settings;
    if (config) {
      // Merge database settings with defaults
      const dbSettings = config.settings || {};
      settings = {
        ...getDefaultSettings(),
        ...dbSettings,
        subscriptionStatus: config.subscription_status || 'trial',
        subscriptionPlan: config.subscription_plan || 'starter'
      };
    } else {
      settings = getDefaultSettings();
    }

    console.log(`[app-proxy] Settings loaded for ${shopDomain}:`, settings);
    return json({ settings }, { 
      headers: { 'Cache-Control': 'public, max-age=60' } 
    });

  } catch (error) {
    console.error('[app-proxy] Error loading settings:', error);
    return json({ settings: getDefaultSettings() }, { status: 200 });
  }
}

// Load the enhanced cart drawer script from assets
async function loadCartDrawerScript() {
  try {
    // In production, this would read from the assets file
    // For now, return a reference to load via the shopify app proxy script endpoint
    return `
      (function() {
        console.log('[Sticky Cart] Loading enhanced cart drawer...');
        var script = document.createElement('script');
        script.src = window.location.origin + '/tools/cart-drawer/enhanced-script?shop=' + (window.STICKY_CART_SHOP_DOMAIN || window.location.hostname);
        script.onload = function() { console.log('[Sticky Cart] Enhanced script loaded'); };
        script.onerror = function() { console.error('[Sticky Cart] Failed to load enhanced script'); };
        document.head.appendChild(script);
      })();
    `;
  } catch (error) {
    console.error('[app-proxy] Error loading cart drawer script:', error);
    return `console.error('[Sticky Cart] Failed to load cart drawer');`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.searchParams.get('path')?.replace(/^\/+/, '') || '';
    let shop = url.searchParams.get('shop') || '';
    
    // Handle direct URL routing if no path param (for different proxy setups)
    if (!path && url.pathname !== '/') {
      const pathSegments = url.pathname.split('/').filter(Boolean);
      path = pathSegments[pathSegments.length - 1] || '';
      
      // Extract shop from query params or headers
      if (!shop) {
        shop = url.searchParams.get('shop') || 
               req.headers.get('x-shop-domain') || 
               req.headers.get('x-forwarded-host') || '';
      }
    }

    console.log(`[app-proxy] path="${path}" shop="${shop}" url="${req.url}"`);

    switch (path) {
      case 'test':
        return json({ 
          success: true, 
          message: 'App proxy is working', 
          shop, 
          ts: new Date().toISOString(),
          debug: {
            url: req.url,
            pathname: url.pathname,
            searchParams: Object.fromEntries(url.searchParams.entries()),
            headers: Object.fromEntries(req.headers.entries())
          }
        }, {
          headers: { 'Cache-Control': 'public, max-age=60' }
        });

      case 'settings':
        return await handleSettingsRequest(shop);

      case 'script':
        const scriptContent = await loadCartDrawerScript();
        return new Response(scriptContent, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            ...corsHeaders,
          },
        });

      case 'enhanced-script':
        // Serve the enhanced cart drawer script (embedded for reliability)
        const cartDrawerScript = `
/**
 * Sticky Cart Drawer - Enhanced with full feature parity
 */

class StickyCartDrawer {
  constructor() {
    this.isOpen = false;
    this.settings = null;
    this.cartData = null;
    this.shopDomain = window.STICKY_CART_SHOP_DOMAIN || window.location.hostname;
    this.shopCurrency = 'USD';
    this.upsellProducts = [];
    this.addOnProducts = [];
    this.selectedUpsells = new Set();
    this.selectedAddOns = new Set();
    
    console.log('[Sticky Cart] Initializing for shop:', this.shopDomain);
    this.init();
  }

  async init() {
    if (!this.shopDomain || !this.shopDomain.endsWith('.myshopify.com')) {
      console.warn('[Sticky Cart] Invalid shop domain, cart drawer disabled');
      return;
    }

    console.log('[Sticky Cart] Loading configuration and data...');
    // Load settings first (can be cached); do not block UI creation on other network calls
    await this.loadSettings();

    if (!this.settings?.cartDrawerEnabled) {
      console.log('[Sticky Cart] Cart drawer disabled in settings');
      return;
    }

    // Initialize UI immediately for fast first paint
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    this.exposeGlobalMethods();
    this.blockNativeCart();

    // Kick off non-critical loads in background
    Promise.all([
      this.loadShopData(),
      this.loadUpsells(),
      this.loadAddOns()
    ]).catch(err => console.warn('[Sticky Cart] Background load error', err));

    // Load cart data (do not block)
    this.loadCartData();

    console.log('[Sticky Cart] Initialization complete!');
  }

  blockNativeCart() {
    // More comprehensive native cart blocking
    const style = document.createElement('style');
    style.id = 'sticky-cart-native-blocker';
    style.textContent = \`
      .cart-drawer, .cart-modal, .drawer.cart, .modal.cart,
      [data-cart-drawer], [data-cart-modal], [id*="cart-drawer"], [class*="cart-drawer"],
      .shopify-cart-drawer, .cart-popup, .cart-overlay, .cart-panel,
      .mini-cart, .cart-sidebar, .cart-flyout, .side-cart, .cart-offcanvas,
      .cart-notification, .cart-widget, .ajax-cart, .cart-slider,
      #cart-sidebar, #cart-drawer, #mini-cart, #cart-modal, .cart-form-modal {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -1 !important;
      }
      
      body.cart-loading * {
        pointer-events: none !important;
      }
    \`;
    document.head.appendChild(style);

    // Enhanced cart button blocking
    document.addEventListener('click', (e) => {
      const target = e.target.closest(\`
        a[href*="/cart"], a[href="/cart"], [data-cart-drawer], [data-cart-modal], 
        .cart-link, .cart-icon, .cart-button, .cart-toggle, .header-cart,
        [class*="cart-"], [id*="cart-"], .js-cart, .ajax-cart-trigger,
        .cart-opener, .open-cart, .show-cart, .toggle-cart
      \`);
      
      if (target && !target.classList.contains('sticky-cart-btn') && !target.closest('.sticky-cart-drawer')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[Sticky Cart] Blocked native cart interaction, opening our drawer');
        setTimeout(() => this.openDrawer(), 50); // Small delay to ensure drawer is ready
        return false;
      }
    }, true);

    // Block form submissions to /cart
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.action && form.action.includes('/cart') && !form.classList.contains('sticky-cart-form')) {
        e.preventDefault();
        console.log('[Sticky Cart] Blocked cart form submission');
        this.handleAddToCart(form);
        return false;
      }
    }, true);
  }

  async handleAddToCart(form) {
    try {
      const formData = new FormData(form);
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await this.loadCartData();
        this.openDrawer();
        this.showNotification('Item added to cart!');
      }
    } catch (error) {
      console.error('[Sticky Cart] Error adding to cart:', error);
    }
  }

  async loadSettings() {
    try {
      console.log('[Sticky Cart] Loading settings from Supabase...');
      
      const response = await fetch(\`https://\${this.shopDomain}/tools/cart-drawer/settings?shop=\${this.shopDomain}\`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.settings = data.settings || data;
        console.log('[Sticky Cart] Settings loaded:', this.settings);
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      console.error('[Sticky Cart] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      cartDrawerEnabled: true,
      stickyButtonEnabled: true,
      stickyButtonPosition: 'bottom-right',
      stickyButtonText: 'Cart',
      themeColor: '#000000',
      freeShippingEnabled: true,
      freeShippingThreshold: 50,
      upsellsEnabled: false,
      addOnsEnabled: false,
      discountBarEnabled: false,
      announcementText: '',
      drawerPosition: 'right'
    };
  }

  async loadShopData() {
    try {
      if (window.Shopify?.shop) {
        this.shopCurrency = window.Shopify.shop.currency || window.Shopify.currency?.active || 'USD';
        return;
      }
      
      const response = await fetch('/cart.js');
      if (response.ok) {
        const cart = await response.json();
        this.shopCurrency = cart.currency || 'USD';
      }
    } catch (error) {
      this.shopCurrency = 'USD';
    }
  }

  async loadUpsells() {
    try {
      const response = await fetch(\`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/upsells\`, {
        method: 'GET',
        headers: { 
          'x-shop-domain': this.shopDomain,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.upsellProducts = data.products || [];
      } else {
        console.warn('[Sticky Cart] Failed to load upsells:', response.status);
        this.upsellProducts = [];
      }
    } catch (error) {
      console.warn('[Sticky Cart] Error loading upsells:', error);
      this.upsellProducts = [];
    }
  }

  async loadAddOns() {
    try {
      const response = await fetch(\`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/addons\`, {
        method: 'GET',
        headers: { 
          'x-shop-domain': this.shopDomain,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.addOnProducts = data.products || [];
        
        this.addOnProducts.forEach(addon => {
          if (addon.default_selected) {
            this.selectedAddOns.add(addon.product_id);
          }
        });
      } else {
        console.warn('[Sticky Cart] Failed to load addons:', response.status);
        this.addOnProducts = [];
      }
    } catch (error) {
      console.warn('[Sticky Cart] Error loading addons:', error);
      this.addOnProducts = [];
    }
  }

  async loadCartData() {
    try {
      const response = await fetch('/cart.js');
      if (response.ok) {
        this.cartData = await response.json();
        this.updateCartDisplay();
        this.updateStickyButtonCount();
        this.dispatchCartEvent();
      }
    } catch (error) {
      console.error('[Sticky Cart] Error loading cart:', error);
    }
  }

  dispatchCartEvent() {
    const event = new CustomEvent('cart:itemCountUpdated', {
      detail: { 
        itemCount: this.cartData?.item_count || 0,
        total: this.cartData?.total_price || 0
      }
    });
    document.dispatchEvent(event);
  }

  createStickyButton() {
    if (!this.settings?.stickyButtonEnabled) return;

    const button = document.createElement('button');
    button.className = 'sticky-cart-btn';
    button.innerHTML = \`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span class="cart-count">0</span>
      <span class="cart-text">\${this.settings.stickyButtonText || 'Cart'}</span>
    \`;
    
    const position = this.settings.stickyButtonPosition || 'bottom-right';
    const themeColor = this.settings.themeColor || '#000000';
    
    const styles = \`
      position: fixed;
      z-index: 999999;
      background: \${themeColor};
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 18px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      backdrop-filter: blur(8px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      \${this.getPositionStyles(position)}
    \`;
    
    button.style.cssText = styles;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.openDrawer();
    });
    
    document.body.appendChild(button);
    this.stickyButton = button;
  }

  getPositionStyles(position) {
    const positions = {
      'bottom-right': 'bottom: 24px; right: 24px;',
      'bottom-left': 'bottom: 24px; left: 24px;',
      'top-right': 'top: 24px; right: 24px;',
      'top-left': 'top: 24px; left: 24px;'
    };
    return positions[position] || positions['bottom-right'];
  }

  createCartDrawer() {
    const drawer = document.createElement('div');
    drawer.className = 'sticky-cart-drawer';
    
    const position = this.settings?.drawerPosition || 'right';
    const themeColor = this.settings?.themeColor || '#000000';
    
    drawer.style.cssText = \`
      position: fixed;
      top: 0;
      \${position}: -420px;
      width: 420px;
      max-width: 90vw;
      height: 100vh;
      background: #ffffff;
      z-index: 1000000;
      transition: \${position} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: \${position === 'left' ? '4px' : '-4px'} 0 25px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-\${position === 'left' ? 'right' : 'left'}: 2px solid \${themeColor}20;
    \`;

    drawer.innerHTML = this.getDrawerHTML(themeColor);

    const overlay = document.createElement('div');
    overlay.className = 'sticky-cart-overlay';
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    \`;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    
    this.cartDrawer = drawer;
    this.cartOverlay = overlay;
    this.drawerPosition = position;
  }

  getDrawerHTML(themeColor) {
    return \`
      <div class="cart-header" style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #f9fafb;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">Shopping Cart</h3>
        <button class="close-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; padding: 4px; line-height: 1; color: #6b7280; border-radius: 6px; transition: all 0.2s ease;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='none'">×</button>
      </div>
      
      <div class="cart-content" style="flex: 1; overflow-y: auto; padding: 24px;">
        <div class="free-shipping-section"></div>
        <div class="cart-items-section">
          <div class="cart-items"></div>
        </div>
        <div class="upsells-section"></div>
        <div class="addons-section"></div>
        <div class="discount-section"></div>
        <div class="announcement-section"></div>
      </div>
      
      <div class="cart-footer" style="padding: 24px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
        <div class="cart-summary" style="margin-bottom: 20px;">
          <div class="cart-total" style="display: flex; justify-content: space-between; align-items: center; font-size: 20px; font-weight: 700; color: #111827;">
            <span>Total:</span>
            <span class="total-price">$0.00</span>
          </div>
        </div>
        <div class="checkout-buttons" style="display: flex; flex-direction: column; gap: 12px;">
          <button class="checkout-btn" style="width: 100%; padding: 16px; background: linear-gradient(135deg, \${themeColor}, \${themeColor}dd); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px \${themeColor}40;">
            Proceed to Checkout
          </button>
          <button class="continue-shopping-btn" style="width: 100%; padding: 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
            Continue Shopping
          </button>
        </div>
      </div>
    \`;
  }

  bindEvents() {
    if (!this.cartDrawer || !this.cartOverlay) {
      console.error('[Sticky Cart] Cannot bind events - drawer components not found');
      return;
    }

    const closeBtn = this.cartDrawer.querySelector('.close-btn');
    const continueBtn = this.cartDrawer.querySelector('.continue-shopping-btn');
    const checkoutBtn = this.cartDrawer.querySelector('.checkout-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.closeDrawer());
    }
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        window.location.href = '/checkout';
      });
    }
    
    this.cartOverlay.addEventListener('click', () => this.closeDrawer());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDrawer();
      }
    });
    
    console.log('[Sticky Cart] Events bound successfully');
  }

  updateCartDisplay() {
    if (!this.cartData) return;
    
    const cartItemsContainer = this.cartDrawer.querySelector('.cart-items');
    const totalPriceElement = this.cartDrawer.querySelector('.total-price');
    
    // Update total
    const total = (this.cartData.total_price / 100).toFixed(2);
    totalPriceElement.textContent = \`$\${total}\`;
    
    // Update cart items
    if (this.cartData.items && this.cartData.items.length > 0) {
      cartItemsContainer.innerHTML = this.cartData.items.map(item => \`
        <div class="cart-item" style="display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
          <img src="\${item.image}" alt="\${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">\${item.title}</h4>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Qty: \${item.quantity}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #111827;">$\${(item.line_price / 100).toFixed(2)}</p>
          </div>
        </div>
      \`).join('');
    } else {
      cartItemsContainer.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px 0;">Your cart is empty</p>';
    }
    
    this.updateFreeShippingBar();
  }

  updateFreeShippingBar() {
    if (!this.settings?.freeShippingEnabled) return;
    
    const freeShippingSection = this.cartDrawer.querySelector('.free-shipping-section');
    const threshold = this.settings.freeShippingThreshold || 50;
    const currentTotal = (this.cartData?.total_price || 0) / 100;
    const remaining = Math.max(0, threshold - currentTotal);
    const percentage = Math.min(100, (currentTotal / threshold) * 100);
    
    if (remaining > 0) {
      freeShippingSection.innerHTML = \`
        <div style="margin-bottom: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #166534;">
            Add $\${remaining.toFixed(2)} more for FREE shipping!
          </p>
          <div style="width: 100%; height: 8px; background: #dcfce7; border-radius: 4px; overflow: hidden;">
            <div style="width: \${percentage}%; height: 100%; background: #16a34a; transition: width 0.3s ease;"></div>
          </div>
        </div>
      \`;
    } else {
      freeShippingSection.innerHTML = \`
        <div style="margin-bottom: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534; text-align: center;">
            🎉 You qualify for FREE shipping!
          </p>
        </div>
      \`;
    }
  }

  updateStickyButtonCount() {
    if (!this.stickyButton || !this.cartData) return;
    
    const countElement = this.stickyButton.querySelector('.cart-count');
    const itemCount = this.cartData.item_count || 0;
    countElement.textContent = itemCount;
    countElement.style.display = itemCount > 0 ? 'inline' : 'none';
  }

  openDrawer() {
    if (!this.cartDrawer || !this.cartOverlay) {
      console.warn('[Sticky Cart] Drawer not initialized yet, attempting to reinitialize...');
      // Try to reinitialize if components are missing
      if (!this.cartDrawer && this.settings) {
        this.createCartDrawer();
        this.bindEvents();
      }
      // If still not available after recreation attempt, return
      if (!this.cartDrawer || !this.cartOverlay) {
        console.error('[Sticky Cart] Unable to initialize drawer components');
        return;
      }
    }
    
    console.log('[Sticky Cart] Opening drawer...', {
      drawer: !!this.cartDrawer,
      overlay: !!this.cartOverlay,
      position: this.drawerPosition,
      isOpen: this.isOpen
    });
    
    this.isOpen = true;
    
    // Ensure drawer is properly positioned and visible
    if (!document.body.contains(this.cartDrawer)) document.body.appendChild(this.cartDrawer);
    if (!document.body.contains(this.cartOverlay)) document.body.appendChild(this.cartOverlay);
    this.cartDrawer.style[this.drawerPosition] = '0px';
    this.cartDrawer.style.visibility = 'visible';
    this.cartDrawer.style.opacity = '1';
    this.cartDrawer.style.pointerEvents = 'auto';
    
    // Show overlay
    this.cartOverlay.style.opacity = '1';
    this.cartOverlay.style.visibility = 'visible';
    this.cartOverlay.style.pointerEvents = 'auto';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.remove('js-drawer-open', 'cart-open', 'overflow-hidden');
    
    // Update cart display
    this.loadCartData();
    this.trackEvent('cart_drawer_opened');
    
    console.log('[Sticky Cart] Drawer opened successfully');
  }

  closeDrawer() {
    this.isOpen = false;
    this.cartDrawer.style[this.drawerPosition] = '-420px';
    this.cartDrawer.style.pointerEvents = 'none';
    this.cartDrawer.style.visibility = 'hidden';
    this.cartDrawer.style.opacity = '0';
    this.cartOverlay.style.opacity = '0';
    this.cartOverlay.style.visibility = 'hidden';
    this.cartOverlay.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 1000001;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    \`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  trackEvent(eventName, data = {}) {
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
      }
      if (typeof fbq !== 'undefined') {
        fbq('track', eventName, data);
      }
    } catch (error) {
      console.log('[Sticky Cart] Analytics tracking error:', error);
    }
  }

  exposeGlobalMethods() {
    window.StickyCart = {
      openDrawer: () => this.openDrawer(),
      closeDrawer: () => this.closeDrawer(),
      refresh: () => this.loadCartData(),
      getCart: () => this.cartData
    };
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new StickyCartDrawer();
  });
} else {
  new StickyCartDrawer();
}
        `;
        
        // Inject the shop domain
        const injectedScript = `
          window.STICKY_CART_SHOP_DOMAIN = '${shop}';
          ${cartDrawerScript}
        `;
        
        return new Response(injectedScript, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            ...corsHeaders,
          },
        });

      default:
        // If no valid path is found, return test response as fallback for debugging
        console.log(`[app-proxy] Unknown path "${path}", returning debug response`);
        return json({ 
          success: true, 
          message: 'App proxy is working (unknown path fallback)', 
          shop, 
          path,
          ts: new Date().toISOString(),
          debug: {
            url: req.url,
            pathname: url.pathname,
            searchParams: Object.fromEntries(url.searchParams.entries())
          }
        });
    }
  } catch (error) {
    console.error('[app-proxy] Error:', error);
    return json({ 
      error: 'Server error',
      message: error.message,
      success: false,
      ts: new Date().toISOString(),
      debug: {
        url: req.url
      }
    }, { 
      status: 500 
    });
  }
});
