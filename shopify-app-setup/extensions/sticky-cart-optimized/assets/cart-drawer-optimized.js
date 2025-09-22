/**
 * Optimized Sticky Cart Drawer - Local Settings Version
 * Fast loading, no Supabase credentials exposed, unified for preview and production
 */

class OptimizedStickyCartDrawer {
  constructor() {
    this.isOpen = false;
    this.settings = null;
    this.cartData = null;
    this.shopDomain = null;
    this.upsells = [];
    this.addons = [];
    this.isPreview = false;
    
    this.init();
  }

  async init() {
    console.log('[Sticky Cart] Initializing optimized cart drawer...');
    
    // Determine shop domain quickly
    this.determineShopDomain();
    
    if (!this.shopDomain) {
      console.warn('Unable to determine shop domain, cart drawer disabled');
      return;
    }

    // Load settings from local file (fast!)
    await this.loadLocalSettings();
    
    if (!this.settings?.cartDrawerEnabled) {
      console.log('Cart drawer disabled in settings');
      return;
    }
    
    // Initialize components
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    this.exposeGlobalMethods();
    
    // Load cart data in background
    this.loadCartData();
    
    console.log('[Sticky Cart] Optimized initialization complete!');
  }

  determineShopDomain() {
    // Quick shop domain detection
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      this.shopDomain = shopParam;
      return;
    }
    
    // Check for demo/preview mode
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.app')) {
      this.isPreview = true;
      this.shopDomain = 'demo-shop.myshopify.com';
      return;
    }
    
    // Get from Shopify global or hostname
    this.shopDomain = window.Shopify?.shop || window.SHOP_DOMAIN || window.location.hostname;
    
    if (this.shopDomain.endsWith('.myshopify.com')) {
      localStorage.setItem('shop_domain', this.shopDomain);
    }
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

      // Prefer loading JSON directly from Supabase Storage (no script execution needed)
      const SUPABASE_URL = 'https://mjfzxmpscndznuaeoxft.supabase.co';
      const storageBase = `${SUPABASE_URL}/storage/v1/object/public/cart-settings/${this.shopDomain}`;
      const cacheBust = Math.floor(Date.now() / 300000); // 5-min cache window

      try {
        const jsonRes = await fetch(`${storageBase}/settings.json?t=${cacheBust}`, { cache: 'no-store' });
        if (jsonRes.ok) {
          const payload = await jsonRes.json();
          this.settings = payload.settings || payload || this.getDefaultSettings();
          this.upsells = payload.upsells || [];
          this.addons = payload.addons || [];
          // Mirror globals for any code expecting them
          window.STICKY_CART_SETTINGS = this.settings;
          window.STICKY_CART_UPSELLS = this.upsells;
          window.STICKY_CART_ADDONS = this.addons;
          window.STICKY_CART_SETTINGS_LOADED = Date.now();
          console.log('[Sticky Cart] Local settings loaded from storage JSON:', this.settings);
          return;
        }
      } catch (e) {
        console.warn('[Sticky Cart] Failed to load storage JSON, will try JS/proxy next', e);
      }

      // Fallback 1: Load settings JS directly from Storage (may be blocked by CSP)
      const storageJsUrl = `${storageBase}/settings.js?t=${cacheBust}`;
      const storageScript = document.createElement('script');
      storageScript.src = storageJsUrl;

      const tryProxyAfterStorage = () => new Promise((resolve) => {
        const proxyUrl = `/tools/cart-drawer/settings?shop=${this.shopDomain}&t=${cacheBust}`;
        const proxyScript = document.createElement('script');
        proxyScript.src = proxyUrl;
        proxyScript.onload = () => {
          this.settings = window.STICKY_CART_SETTINGS || this.getDefaultSettings();
          this.upsells = window.STICKY_CART_UPSELLS || [];
          this.addons = window.STICKY_CART_ADDONS || [];
          console.log('[Sticky Cart] Local settings loaded from app proxy');
          resolve(true);
        };
        proxyScript.onerror = () => {
          console.warn('[Sticky Cart] App proxy settings load failed, using defaults');
          this.settings = this.getDefaultSettings();
          resolve(true);
        };
        document.head.appendChild(proxyScript);
        setTimeout(() => {
          if (!this.settings) {
            this.settings = this.getDefaultSettings();
            resolve(true);
          }
        }, 1500);
      });

      await new Promise((resolve) => {
        storageScript.onload = () => {
          this.settings = window.STICKY_CART_SETTINGS || this.getDefaultSettings();
          this.upsells = window.STICKY_CART_UPSELLS || [];
          this.addons = window.STICKY_CART_ADDONS || [];
          console.log('[Sticky Cart] Local settings loaded from storage JS');
          resolve(true);
        };
        storageScript.onerror = async () => {
          console.warn('[Sticky Cart] Storage JS load failed, trying app proxy');
          await tryProxyAfterStorage();
          resolve(true);
        };
        document.head.appendChild(storageScript);
        setTimeout(async () => {
          if (!this.settings) {
            console.warn('[Sticky Cart] Storage JS timed out, trying app proxy');
            await tryProxyAfterStorage();
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
      stickyButton: {
        enabled: true,
        text: 'Cart',
        position: 'bottom-right'
      },
      freeShipping: {
        enabled: false,
        threshold: 50
      },
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
      stickyButton: {
        enabled: true,
        text: 'Cart',
        position: 'bottom-right'
      },
      freeShipping: {
        enabled: true,
        threshold: 75
      },
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
      return `${currency} ${value.toFixed(2)}`;
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
    
    // Remove existing buttons (both optimized and react versions)
    const existingButtons = document.querySelectorAll('.sticky-cart-button');
    existingButtons.forEach(btn => btn.remove());

    const button = document.createElement('button');
    button.className = 'sticky-cart-button';
    button.setAttribute('data-cart-source', 'optimized');
    
    const position = this.settings?.stickyButton?.position || this.settings?.stickyButtonPosition || 'bottom-right';
    const positionStyles = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' }
    };

    button.style.cssText = `
      position: fixed;
      z-index: 9999;
      padding: 12px 16px;
      background: ${this.settings?.themeColor || '#3B82F6'};
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
      ${Object.entries(positionStyles[position] || positionStyles['bottom-right']).map(([k, v]) => `${k}: ${v}`).join('; ')};
    `;

    const itemCount = this.cartData?.item_count || 0;
    const buttonText = this.settings?.stickyButton?.text || this.settings?.stickyButtonText || 'Cart';
    button.innerHTML = `
      <span>🛒</span>
      <span>${buttonText}</span>
      ${itemCount > 0 ? `<span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 12px;">${itemCount}</span>` : ''}
    `;

    button.addEventListener('click', () => this.openDrawer());
    document.body.appendChild(button);
    this.stickyButton = button;
  }

  createCartDrawer() {
    // Add minimal styles
    if (!document.getElementById('optimized-cart-styles')) {
      const style = document.createElement('style');
      style.id = 'optimized-cart-styles';
      style.textContent = `
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
          position: absolute; top: 0; width: 400px; max-width: 90vw; height: 100%; 
          background: white; transition: transform 0.3s ease;
          display: flex; flex-direction: column; box-shadow: -4px 0 16px rgba(0,0,0,0.15);
        }
        .optimized-cart-panel[data-position="right"] { right: 0; transform: translateX(100%); }
        .optimized-cart-panel[data-position="left"] { left: 0; transform: translateX(-100%); }
        .optimized-cart-drawer.open .optimized-cart-panel { transform: translateX(0); }
        .cart-item { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid #eee; }
        .cart-item img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
        .cart-item-details { flex: 1; min-width: 0; }
        .cart-item-title { font-weight: 500; margin: 0 0 4px 0; }
        .cart-item-price { font-size: 14px; color: #666; }
      `;
      document.head.appendChild(style);
    }

    const drawer = document.createElement('div');
    drawer.className = 'optimized-cart-drawer';
    const drawerPosition = this.settings?.drawerPosition || 'right';
    drawer.innerHTML = `
      <div class="optimized-cart-overlay"></div>
      <div class="optimized-cart-panel" data-position="${drawerPosition}">
        <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Your Cart</h2>
          <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        <div class="cart-body" style="flex: 1; overflow-y: auto; padding: 20px;">
          <div class="cart-items"></div>
          <div class="cart-features"></div>
        </div>
        <div class="cart-footer" style="padding: 20px; border-top: 1px solid #eee; background: white;">
          <div class="cart-total" style="margin-bottom: 15px; text-align: right;"></div>
          <button class="checkout-btn" style="width: 100%; padding: 15px; background: ${this.settings?.themeColor || '#3B82F6'}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
            Proceed to Checkout
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.drawer = drawer;

    // Bind events
    drawer.querySelector('.close-btn').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.optimized-cart-overlay').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.checkout-btn').addEventListener('click', () => {
      window.location.href = '/checkout';
    });
  }

  bindEvents() {
    // Block native cart interactions when our drawer should handle them
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Block native cart links/buttons
      if (target.matches('[href*="/cart"]') || 
          target.matches('[data-cart-drawer]') ||
          target.matches('.cart-toggle') ||
          target.matches('.js-cart-link')) {
        
        // Don't block if it's our own button
        if (!target.closest('[data-cart-source="optimized"]')) {
          e.preventDefault();
          e.stopPropagation();
          this.openDrawer();
          console.log('[Sticky Cart] Blocked native cart interaction, opening our drawer');
        }
      }
    }, true);
  }

  exposeGlobalMethods() {
    window.stickyCartDrawer = {
      openDrawer: () => this.openDrawer(),
      closeDrawer: () => this.closeDrawer(),
      toggleDrawer: () => this.toggleDrawer(),
      updateItemCount: (count) => this.updateItemCount(count),
      updateQuantity: (itemId, newQuantity) => this.updateQuantity(itemId, newQuantity),
      removeItem: (itemId) => this.removeItem(itemId),
      isOptimized: true
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
    
    console.log('[Sticky Cart] Drawer opened');
  }

  closeDrawer() {
    if (!this.drawer) return;
    
    this.isOpen = false;
    this.drawer.classList.remove('open');
    document.body.style.overflow = '';
    document.body.removeAttribute('data-sticky-cart-open');
    
    console.log('[Sticky Cart] Drawer closed');
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
      const countSpan = this.stickyButton.querySelector('span:last-child');
      if (itemCount > 0) {
        countSpan.textContent = itemCount;
        countSpan.style.display = 'inline';
      } else {
        countSpan.style.display = 'none';
      }
    }

    // Update cart items
    const itemsContainer = this.drawer.querySelector('.cart-items');
    if (itemCount === 0) {
      itemsContainer.innerHTML = `
        <div style="text-center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">Your cart is empty</h3>
          <p style="margin: 0; color: #666;">Add some items to get started!</p>
        </div>
      `;
    } else {
      itemsContainer.innerHTML = this.cartData.items.map(item => `
        <div class="cart-item">
          <img src="${item.image || '/placeholder.svg'}" alt="${item.title}" />
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            ${item.variant_title ? `<p style="font-size: 12px; color: #666; margin: 0;">${item.variant_title}</p>` : ''}
            <p class="cart-item-price">${this.formatCurrency(item.price / 100)} × ${item.quantity}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <button onclick="window.stickyCartDrawer?.updateQuantity?.(${item.id}, ${item.quantity - 1})" 
                      style="width: 28px; height: 28px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">−</button>
              <span style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; min-width: 40px; text-align: center;">${item.quantity}</span>
              <button onclick="window.stickyCartDrawer?.updateQuantity?.(${item.id}, ${item.quantity + 1})" 
                      style="width: 28px; height: 28px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
              <button onclick="window.stickyCartDrawer?.removeItem?.(${item.id})" 
                      style="margin-left: auto; padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Update total
    const totalContainer = this.drawer.querySelector('.cart-total');
    totalContainer.innerHTML = `
      <div style="font-size: 18px; font-weight: 600;">
        Total: ${this.formatCurrency(total / 100)}
      </div>
    `;

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

      featuresHTML += `
        <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
            <span>Free shipping progress</span>
            <span>${Math.round(progress)}%</span>
          </div>
          <div style="width: 100%; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: ${this.settings?.themeColor || '#3B82F6'}; width: ${progress}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 14px; text-align: center;">
            ${remaining > 0 ? `Add ${this.formatCurrency(remaining)} more for free shipping!` : '🎉 You qualify for free shipping!'}
          </p>
        </div>
      `;
    }

    // Upsells
    if (this.settings?.upsells?.enabled && this.upsells.length > 0) {
      featuresHTML += `
        <div style="margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Frequently Bought Together</h3>
          ${this.upsells.slice(0, 2).map(upsell => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;">
              ${upsell.product_image_url ? `<img src="${upsell.product_image_url}" alt="${upsell.product_title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px;" />` : ''}
              <div style="flex: 1;">
                <h5 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">${upsell.product_title}</h5>
                <p style="margin: 0; font-size: 14px; font-weight: 600;">${this.formatCurrency(upsell.product_price)}</p>
              </div>
              <button style="padding: 6px 12px; background: ${this.settings?.themeColor || '#3B82F6'}; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Add</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Add-ons
    if (this.settings?.addOns?.enabled && this.addons.length > 0) {
      featuresHTML += `
        <div style="margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Protect Your Purchase</h3>
          ${this.addons.slice(0, 2).map(addon => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <h5 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500;">${addon.product_title}</h5>
                ${addon.description ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${addon.description}</p>` : ''}
                <p style="margin: 0; font-size: 14px; font-weight: 600;">${this.formatCurrency(addon.product_price)}</p>
              </div>
              <button style="padding: 6px 12px; background: transparent; color: ${this.settings?.themeColor || '#3B82F6'}; border: 1px solid ${this.settings?.themeColor || '#3B82F6'}; border-radius: 6px; font-size: 12px; cursor: pointer;">Add</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    featuresContainer.innerHTML = featuresHTML;
  }

  updateItemCount(count) {
    if (this.stickyButton) {
      const countSpan = this.stickyButton.querySelector('span:last-child');
      if (count > 0) {
        countSpan.textContent = count;
        countSpan.style.display = 'inline';
      } else {
        countSpan.style.display = 'none';
      }
    }
  }

  async updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
      await this.removeItem(itemId);
      return;
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: newQuantity })
      });
      
      if (response.ok) {
        await this.loadCartData();
      }
    } catch (error) {
      console.error('Failed to update item quantity:', error);
    }
  }

  async removeItem(itemId) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity: 0 })
      });
      
      if (response.ok) {
        await this.loadCartData();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }
}

// Initialize when DOM is ready - DISABLED in favor of React components
// Uncomment below lines to re-enable JavaScript cart drawer
/*
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptimizedStickyCartDrawer();
  });
} else {
  new OptimizedStickyCartDrawer();
}
*/

console.log('[Sticky Cart] Optimized script loaded');