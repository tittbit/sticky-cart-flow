import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shop-domain',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    console.log('[App Proxy] Request:', req.method, url.pathname);

    // Test endpoint for proxy connectivity
    if (url.pathname.endsWith('/test')) {
      const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'App proxy is working',
          shop: shopDomain,
          ts: new Date().toISOString(),
          debug: {
            method: req.method,
            path: url.pathname,
            headers: Object.fromEntries(req.headers.entries())
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Settings file endpoint - serves local JS settings for fast cart loading
    if (url.pathname.endsWith('/settings')) {
      const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
      
      if (!shopDomain) {
        return new Response('Shop domain required', { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      try {
        // Fetch settings from the cart-settings-generator
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        
        const settingsResponse = await fetch(`${supabaseUrl}/functions/v1/cart-settings-generator`, {
          method: 'GET',
          headers: {
            'x-shop-domain': shopDomain,
            'authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          }
        });

        if (settingsResponse.ok) {
          const settingsJS = await settingsResponse.text();
          return new Response(settingsJS, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/javascript',
              'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }

      // Fallback default settings
      const defaultSettings = `
// Default cart settings fallback
window.STICKY_CART_SETTINGS = {
  enabled: true,
  cartDrawerEnabled: true,
  stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
  freeShipping: { enabled: false, threshold: 50 },
  upsells: { enabled: false },
  addOns: { enabled: false },
  discountBar: { enabled: false, code: '' },
  themeColor: '#3B82F6',
  currency: 'USD'
};
window.STICKY_CART_UPSELLS = [];
window.STICKY_CART_ADDONS = [];
window.STICKY_CART_SETTINGS_LOADED = Date.now();
console.log('[Sticky Cart] Default settings loaded (fallback)');
      `;

      return new Response(defaultSettings, {
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }

    // Main cart script endpoint - optimized version that uses local settings
    if (url.pathname.endsWith('/script')) {
      const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
      
      const cartScript = `
// Optimized Sticky Cart Drawer Script (Uses Local Settings)
// Generated: ${new Date().toISOString()}
console.log('[Sticky Cart] Loading optimized cart drawer script...');

class OptimizedStickyCartDrawer {
  constructor() {
    this.isOpen = false;
    this.settings = null;
    this.cartData = null;
    this.shopDomain = '${shopDomain}';
    this.upsells = [];
    this.addons = [];
    this.isPreview = window.location.hostname.includes('lovable.app') || window.location.hostname === 'localhost';
    
    this.init();
  }

  async init() {
    console.log('[Sticky Cart] Initializing optimized cart drawer...');
    
    // Load settings from local file (fast!)
    await this.loadLocalSettings();
    
    if (!this.settings?.cartDrawerEnabled) {
      console.log('Cart drawer disabled in settings');
      return;
    }
    
    // Initialize components immediately
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    this.exposeGlobalMethods();
    
    // Load cart data in background
    this.loadCartData();
    
    console.log('[Sticky Cart] Optimized initialization complete!');
  }

  async loadLocalSettings() {
    try {
      // Check if settings are already loaded globally
      if (window.STICKY_CART_SETTINGS) {
        this.settings = window.STICKY_CART_SETTINGS;
        this.upsells = window.STICKY_CART_UPSELLS || [];
        this.addons = window.STICKY_CART_ADDONS || [];
        console.log('[Sticky Cart] Using pre-loaded global settings');
        return;
      }

      if (this.isPreview) {
        // Use mock settings for preview
        this.settings = this.getPreviewSettings();
        this.upsells = this.getPreviewUpsells();
        this.addons = this.getPreviewAddons();
        console.log('[Sticky Cart] Using preview settings');
        return;
      }

      // Load settings file from app proxy with cache busting
      const settingsUrl = window.location.origin + \`/tools/cart-drawer/settings?shop=\${this.shopDomain}&t=\${Math.floor(Date.now() / 300000)}\`;
      
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = settingsUrl;
        
        script.onload = () => {
          this.settings = window.STICKY_CART_SETTINGS || this.getDefaultSettings();
          this.upsells = window.STICKY_CART_UPSELLS || [];
          this.addons = window.STICKY_CART_ADDONS || [];
          console.log('[Sticky Cart] Local settings loaded from file');
          resolve(true);
        };
        
        script.onerror = () => {
          console.warn('[Sticky Cart] Settings file load failed, using defaults');
          this.settings = this.getDefaultSettings();
          this.upsells = [];
          this.addons = [];
          resolve(true);
        };
        
        document.head.appendChild(script);
        
        // Fallback timeout
        setTimeout(() => {
          if (!this.settings) {
            this.settings = this.getDefaultSettings();
            this.upsells = [];
            this.addons = [];
            resolve(true);
          }
        }, 1500);
      });
      
    } catch (error) {
      console.error('[Sticky Cart] Settings load error:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      cartDrawerEnabled: true,
      stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
      freeShipping: { enabled: false, threshold: 50 },
      upsells: { enabled: false },
      addOns: { enabled: false },
      discountBar: { enabled: false, code: '' },
      themeColor: '#3B82F6',
      currency: 'USD'
    };
  }

  getPreviewSettings() {
    return {
      cartDrawerEnabled: true,
      stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
      freeShipping: { enabled: true, threshold: 75 },
      upsells: { enabled: true },
      addOns: { enabled: true },
      discountBar: { enabled: true, code: 'SAVE10' },
      themeColor: '#3B82F6',
      currency: 'USD'
    };
  }

  getPreviewUpsells() {
    return [
      {
        id: 1,
        product_title: 'Premium Case',
        product_price: 25.99,
        product_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop'
      }
    ];
  }

  getPreviewAddons() {
    return [
      {
        id: 1,
        product_title: 'Extended Warranty',
        product_price: 19.99,
        description: '2-year protection plan'
      }
    ];
  }

  formatCurrency(amount) {
    const value = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const currency = this.settings?.currency || 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return \`\${currency} \${value.toFixed(2)}\`;
    }
  }

  async loadCartData() {
    try {
      if (this.isPreview) {
        // Mock cart data for preview
        this.cartData = {
          items: [
            {
              id: 1,
              title: 'Premium Wireless Headphones',
              variant_title: 'Black',
              price: 12999,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
            }
          ],
          total_price: 12999,
          item_count: 1,
          currency: 'USD'
        };
        this.updateUI();
        return;
      }

      const response = await fetch('/cart.js');
      if (!response.ok) throw new Error('Cart fetch failed');
      
      this.cartData = await response.json();
      this.updateUI();
    } catch (error) {
      console.error('Failed to load cart data:', error);
    }
  }

  createStickyButton() {
    if (!this.settings?.stickyButton?.enabled) return;
    
    // Remove existing button
    const existing = document.querySelector('.sticky-cart-button[data-cart-source="optimized"]');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.className = 'sticky-cart-button';
    button.setAttribute('data-cart-source', 'optimized');
    
    const position = this.settings.stickyButton.position || 'bottom-right';
    const positionStyles = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' }
    };

    const posStyle = positionStyles[position] || positionStyles['bottom-right'];
    button.style.cssText = \`
      position: fixed;
      z-index: 9999;
      padding: 12px 16px;
      background: \${this.settings?.themeColor || '#3B82F6'};
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-family: inherit;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      \${Object.entries(posStyle).map(([k, v]) => \`\${k}: \${v}\`).join('; ')};
    \`;

    const itemCount = this.cartData?.item_count || 0;
    button.innerHTML = \`
      <span>🛒</span>
      <span>\${this.settings.stickyButton.text || 'Cart'}</span>
      \${itemCount > 0 ? \`<span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 12px;">\${itemCount}</span>\` : ''}
    \`;

    button.addEventListener('click', () => this.openDrawer());
    document.body.appendChild(button);
    this.stickyButton = button;
  }

  createCartDrawer() {
    // Add minimal styles
    if (!document.getElementById('optimized-cart-styles')) {
      const style = document.createElement('style');
      style.id = 'optimized-cart-styles';
      style.textContent = \`
        .optimized-cart-drawer { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; 
          pointer-events: none; opacity: 0; visibility: hidden; transition: all 0.3s ease; 
        }
        .optimized-cart-drawer.open { pointer-events: auto; opacity: 1; visibility: visible; }
        .optimized-cart-overlay { 
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.5); 
        }
        .optimized-cart-panel { 
          position: absolute; top: 0; right: 0; width: 400px; max-width: 90vw; height: 100%; 
          background: white; transform: translateX(100%); transition: transform 0.3s ease;
          display: flex; flex-direction: column; box-shadow: -4px 0 16px rgba(0,0,0,0.15);
        }
        .optimized-cart-drawer.open .optimized-cart-panel { transform: translateX(0); }
        .cart-item { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid #eee; }
        .cart-item img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
        .cart-item-details { flex: 1; min-width: 0; }
        .cart-item-title { font-weight: 500; margin: 0 0 4px 0; }
        .cart-item-price { font-size: 14px; color: #666; }
        
        /* Hide native cart elements when our drawer is open */
        body[data-sticky-cart-open] #CartDrawer,
        body[data-sticky-cart-open] .cart-drawer--open,
        body[data-sticky-cart-open] [data-cart-drawer],
        body[data-sticky-cart-open] [data-drawer-id="cart"],
        body[data-sticky-cart-open] .js-sidebar-cart,
        body[data-sticky-cart-open] .drawer--cart,
        body[data-sticky-cart-open] .cart-popup,
        body[data-sticky-cart-open] [aria-controls*="Cart"] { 
          display: none !important; 
          pointer-events: none !important;
        }
      \`;
      document.head.appendChild(style);
    }

    const drawer = document.createElement('div');
    drawer.className = 'optimized-cart-drawer';
    drawer.innerHTML = \`
      <div class="optimized-cart-overlay"></div>
      <div class="optimized-cart-panel">
        <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Your Cart</h2>
          <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>
        <div class="cart-body" style="flex: 1; overflow-y: auto; padding: 0;">
          <div class="cart-items"></div>
          <div class="cart-features" style="padding: 20px;"></div>
        </div>
        <div class="cart-footer" style="padding: 20px; border-top: 1px solid #eee; background: white;">
          <div class="cart-total" style="margin-bottom: 15px; text-align: right; font-size: 18px; font-weight: 600;"></div>
          <button class="checkout-btn" style="width: 100%; padding: 15px; background: \${this.settings?.themeColor || '#3B82F6'}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.3s;">
            \${this.isPreview ? 'Checkout (Preview)' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    \`;

    document.body.appendChild(drawer);
    this.drawer = drawer;

    // Bind events
    drawer.querySelector('.close-btn').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.optimized-cart-overlay').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.checkout-btn').addEventListener('click', () => {
      if (!this.isPreview) {
        window.location.href = '/checkout';
      }
    });
  }

  bindEvents() {
    // Block native cart interactions
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Check if target or parent elements are cart-related
      const isCartElement = target.matches('[href*="/cart"]') || 
                           target.matches('[data-cart-drawer]') ||
                           target.matches('.cart-toggle') ||
                           target.matches('.js-cart-link') ||
                           target.closest('[href*="/cart"]') ||
                           target.closest('[data-cart-drawer]') ||
                           target.closest('.cart-toggle') ||
                           target.closest('.js-cart-link');
      
      if (isCartElement) {
        // Don't block if it's our own button or coming from our drawer
        if (!target.closest('[data-cart-source="optimized"]') && 
            !target.closest('.optimized-cart-drawer')) {
          e.preventDefault();
          e.stopPropagation();
          this.openDrawer();
          console.log('[Sticky Cart] Blocked native cart interaction, opening our drawer');
        }
      }
    }, true);

    // Listen for cart updates
    document.addEventListener('cart:updated', (e) => {
      this.loadCartData();
    });
  }

  exposeGlobalMethods() {
    window.stickyCartDrawer = {
      openDrawer: () => this.openDrawer(),
      closeDrawer: () => this.closeDrawer(),
      toggleDrawer: () => this.toggleDrawer(),
      updateItemCount: (count) => this.updateItemCount(count),
      isOptimized: true,
      reload: () => this.loadCartData()
    };
  }

  openDrawer() {
    if (!this.drawer) return;
    
    this.isOpen = true;
    this.drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-sticky-cart-open', 'true');
    
    // Load fresh cart data when opening
    this.loadCartData();
    
    console.log('[Sticky Cart] Optimized drawer opened');
  }

  closeDrawer() {
    if (!this.drawer) return;
    
    this.isOpen = false;
    this.drawer.classList.remove('open');
    document.body.style.overflow = '';
    document.body.removeAttribute('data-sticky-cart-open');
    
    console.log('[Sticky Cart] Optimized drawer closed');
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  updateUI() {
    if (!this.cartData || !this.drawer) return;

    const itemCount = this.cartData.item_count || 0;
    const total = this.cartData.total_price || 0;

    // Update sticky button
    if (this.stickyButton) {
      const spans = this.stickyButton.querySelectorAll('span');
      const countSpan = spans[spans.length - 1];
      
      if (itemCount > 0) {
        if (spans.length === 2) {
          // Create count span
          const newCountSpan = document.createElement('span');
          newCountSpan.style.cssText = 'background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 12px;';
          newCountSpan.textContent = itemCount;
          this.stickyButton.appendChild(newCountSpan);
        } else {
          countSpan.textContent = itemCount;
          countSpan.style.display = 'inline';
        }
      } else if (spans.length > 2) {
        countSpan.style.display = 'none';
      }
    }

    // Update cart items
    const itemsContainer = this.drawer.querySelector('.cart-items');
    if (itemCount === 0) {
      itemsContainer.innerHTML = \`
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">Your cart is empty</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">Add some items to get started!</p>
        </div>
      \`;
    } else {
      itemsContainer.innerHTML = this.cartData.items.map(item => \`
        <div class="cart-item">
          <img src="\${item.image || '/placeholder.svg'}" alt="\${item.title}" />
          <div class="cart-item-details">
            <h4 class="cart-item-title">\${item.title}</h4>
            \${item.variant_title ? \`<p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">\${item.variant_title}</p>\` : ''}
            <p class="cart-item-price">\${this.formatCurrency(item.price / 100)} × \${item.quantity}</p>
          </div>
        </div>
      \`).join('');
    }

    // Update total
    const totalContainer = this.drawer.querySelector('.cart-total');
    totalContainer.textContent = \`Total: \${this.formatCurrency(total / 100)}\`;

    // Update features section
    this.updateFeatures();
  }

  updateFeatures() {
    const featuresContainer = this.drawer.querySelector('.cart-features');
    let featuresHTML = '';

    // Free shipping bar
    if (this.settings?.freeShipping?.enabled) {
      const threshold = this.settings.freeShipping.threshold;
      const current = (this.cartData?.total_price || 0) / 100;
      const progress = Math.min((current / threshold) * 100, 100);
      const remaining = Math.max(threshold - current, 0);

      featuresHTML += \`
        <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
            <span>Free shipping progress</span>
            <span>\${Math.round(progress)}%</span>
          </div>
          <div style="width: 100%; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: \${this.settings?.themeColor || '#3B82F6'}; width: \${progress}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; text-align: center; color: #666;">
            \${remaining > 0 ? \`Add \${this.formatCurrency(remaining)} more for free shipping!\` : '🎉 You qualify for free shipping!'}
          </p>
        </div>
      \`;
    }

    // Upsells
    if (this.settings?.upsells?.enabled && this.upsells.length > 0) {
      featuresHTML += \`
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Frequently Bought Together</h3>
          \${this.upsells.slice(0, 2).map(upsell => \`
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;">
              \${upsell.product_image_url ? \`<img src="\${upsell.product_image_url}" alt="\${upsell.product_title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px;" />\` : ''}
              <div style="flex: 1;">
                <h5 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">\${upsell.product_title}</h5>
                <p style="margin: 0; font-size: 14px; font-weight: 600;">\${this.formatCurrency(upsell.product_price)}</p>
              </div>
              <button style="padding: 6px 12px; background: \${this.settings?.themeColor || '#3B82F6'}; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: opacity 0.3s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">Add</button>
            </div>
          \`).join('')}
        </div>
      \`;
    }

    // Add-ons
    if (this.settings?.addOns?.enabled && this.addons.length > 0) {
      featuresHTML += \`
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Protect Your Purchase</h3>
          \${this.addons.slice(0, 2).map(addon => \`
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <h5 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">\${addon.product_title}</h5>
                \${addon.description ? \`<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">\${addon.description}</p>\` : ''}
                <p style="margin: 0; font-size: 14px; font-weight: 600;">\${this.formatCurrency(addon.product_price)}</p>
              </div>
              <button style="padding: 6px 12px; background: transparent; color: \${this.settings?.themeColor || '#3B82F6'}; border: 1px solid \${this.settings?.themeColor || '#3B82F6'}; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.backgroundColor='\${this.settings?.themeColor || '#3B82F6'}'; this.style.color='white'" onmouseout="this.style.backgroundColor='transparent'; this.style.color='\${this.settings?.themeColor || '#3B82F6'}'">Add</button>
            </div>
          \`).join('')}
        </div>
      \`;
    }

    // Discount bar
    if (this.settings?.discountBar?.enabled && this.settings.discountBar.code) {
      featuresHTML += \`
        <div style="margin-bottom: 20px; padding: 16px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0369a1;">💰 Special Offer</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #075985;">
            Use code <code style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600;">\${this.settings.discountBar.code}</code> for a discount!
          </p>
          <button style="padding: 8px 16px; background: \${this.settings?.themeColor || '#3B82F6'}; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: opacity 0.3s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">Apply Code</button>
        </div>
      \`;
    }

    featuresContainer.innerHTML = featuresHTML;
  }

  updateItemCount(count) {
    if (this.stickyButton) {
      const spans = this.stickyButton.querySelectorAll('span');
      if (spans.length > 2) {
        const countSpan = spans[spans.length - 1];
        if (count > 0) {
          countSpan.textContent = count;
          countSpan.style.display = 'inline';
        } else {
          countSpan.style.display = 'none';
        }
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptimizedStickyCartDrawer();
  });
} else {
  new OptimizedStickyCartDrawer();
}

console.log('[Sticky Cart] Optimized script loaded');
      `;

      return new Response(cartScript, {
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }

    // Main loader script - minimal bootstrap that loads the optimized script
    if (url.pathname.endsWith('/loader')) {
      const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
      
      const loaderScript = `
// Sticky Cart Loader - Optimized Version
console.log('[Sticky Cart] Starting optimized loader...');

// Prevent multiple initializations
if (window.stickyCartInitialized) {
  console.log('[Sticky Cart] Already initialized, skipping');
  return;
}
window.stickyCartInitialized = true;

// Store shop domain globally
window.STICKY_CART_SHOP_DOMAIN = '${shopDomain}';

// Load the optimized cart script
const script = document.createElement('script');
script.src = window.location.origin + '/tools/cart-drawer/script?shop=${shopDomain}&t=' + Date.now();
script.async = true;
script.onload = () => console.log('[Sticky Cart] Optimized script loaded successfully');
script.onerror = () => console.error('[Sticky Cart] Failed to load optimized script');
document.head.appendChild(script);
      `;

      return new Response(loaderScript, {
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('App proxy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});