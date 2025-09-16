/**
 * Sticky Cart Drawer - Rewritten for proper shop domain and settings handling
 */

class StickyCartDrawer {
  constructor() {
    this.isOpen = false;
    this.settings = null;
    this.cartData = null;
    this.shopDomain = null;
    this.shopCurrency = 'USD'; // Will be updated from shop data
    this.upsellProducts = [];
    
    this.init();
  }

  async init() {
    // First determine the shop domain
    await this.determineShopDomain();
    
    if (!this.shopDomain) {
      console.warn('Unable to determine shop domain, cart drawer disabled');
      return;
    }

    // Load settings and shop data
    await Promise.all([
      this.loadSettings(),
      this.loadShopData()
    ]);
    
    if (!this.settings?.enabled) {
      console.log('Cart drawer disabled in settings');
      return;
    }
    
    // Initialize components
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    
    // Load initial cart data
    await this.loadCartData();
  }

  async determineShopDomain() {
    // 1) Check URL parameter first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shopParam = params.get('shop');
      if (shopParam?.trim()) {
        this.shopDomain = shopParam.trim();
        localStorage.setItem('shop_domain', this.shopDomain);
        return;
      }
    }

    // 2) Check localStorage
    const saved = localStorage.getItem('shop_domain');
    if (saved?.trim() && saved !== 'demo-shop.myshopify.com') {
      this.shopDomain = saved.trim();
      return;
    }

    // 3) Wait for Shopify global to be available
    let attempts = 0;
    while (attempts < 50 && !this.shopDomain) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const shopifyShop = window.Shopify?.shop;
      const liquidShop = window.SHOP_DOMAIN;
      
      if (shopifyShop && typeof shopifyShop === 'string') {
        this.shopDomain = shopifyShop;
        localStorage.setItem('shop_domain', this.shopDomain);
        return;
      }
      
      if (liquidShop && typeof liquidShop === 'string') {
        this.shopDomain = liquidShop;
        localStorage.setItem('shop_domain', this.shopDomain);
        return;
      }
      
      attempts++;
    }

    // 4) Check if we're on a myshopify domain
    if (location.hostname.endsWith('.myshopify.com')) {
      this.shopDomain = location.hostname;
      localStorage.setItem('shop_domain', this.shopDomain);
      return;
    }

    console.warn('Could not determine shop domain after all attempts');
  }

  async loadShopData() {
    try {
      // Get shop currency and other data from Shopify's shop object
      if (window.Shopify?.shop) {
        this.shopCurrency = window.Shopify.currency?.active || 'USD';
      } else {
        // Fallback: try to get currency from cart or other sources
        const cartResponse = await fetch('/cart.js');
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          this.shopCurrency = cartData.currency || 'USD';
        }
      }
    } catch (error) {
      console.error('Failed to load shop data:', error);
      this.shopCurrency = 'USD'; // Safe fallback
    }
  }

  async loadSettings() {
    try {
      if (!this.shopDomain) {
        throw new Error('No shop domain available');
      }

      const response = await fetch('https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/shop-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-domain': this.shopDomain,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg'
        }
      });

      if (!response.ok) {
        throw new Error(`Settings fetch failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.settings = this.normalizeSettings(data.settings || {});
        this.upsellProducts = data.upsellProducts || [];
        console.log('Settings loaded successfully:', this.settings);
      } else {
        throw new Error('Settings response indicated failure');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use safe defaults
      this.settings = {
        enabled: true,
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
        discountBar: { enabled: false }
      };
    }
  }

  normalizeSettings(raw) {
    return {
      enabled: raw.cartDrawerEnabled !== false,
      stickyButton: {
        enabled: raw.stickyButtonEnabled !== false,
        text: raw.stickyButtonText || raw.buttonText || 'Cart',
        position: raw.stickyButtonPosition || raw.buttonPosition || 'bottom-right'
      },
      freeShipping: {
        enabled: raw.freeShippingEnabled === true || raw.freeShippingBarEnabled === true,
        threshold: raw.freeShippingThreshold || 50
      },
      upsells: {
        enabled: raw.upsellsEnabled === true
      },
      addOns: {
        enabled: raw.addOnsEnabled === true
      },
      discountBar: {
        enabled: raw.discountBarEnabled === true || raw.discountPromoEnabled === true
      },
      themeColor: raw.themeColor || '#000000',
      announcementText: raw.announcementText || '',
      discountCode: raw.discountCode || ''
    };
  }

  formatCurrency(amount) {
    const value = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    try {
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        style: 'currency',
        currency: this.shopCurrency || 'USD',
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      // Fallback
      return `${this.shopCurrency || 'USD'} ${value.toFixed(2)}`;
    }
  }

  async loadCartData() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) throw new Error('Cart fetch failed');
      
      this.cartData = await response.json();
      this.updateUI();
    } catch (error) {
      console.error('Failed to load cart data:', error);
    }
  }

  async trackEvent(eventType, additionalData = {}) {
    if (!this.shopDomain) return;

    try {
      await fetch('https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-domain': this.shopDomain,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg'
        },
        body: JSON.stringify({
          eventType,
          sessionId: this.getSessionId(),
          cartTotal: this.cartData?.total_price ? (this.cartData.total_price / 100) : 0,
          itemCount: this.cartData?.item_count || 0,
          productId: additionalData?.productId,
          variantId: additionalData?.variantId,
          eventData: additionalData || {}
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }

  createStickyButton() {
    if (!this.settings?.stickyButton?.enabled) return;

    const button = document.createElement('button');
    button.className = 'sticky-cart-button';
    button.style.cssText = `
      position: fixed;
      z-index: 9999;
      padding: 12px 16px;
      background: ${this.settings.themeColor || '#000000'};
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
    `;

    // Position the button
    const position = this.settings.stickyButton.position || 'bottom-right';
    const positions = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' }
    };
    
    Object.assign(button.style, positions[position] || positions['bottom-right']);

    button.innerHTML = `
      <span class="cart-icon">🛒</span>
      <span class="cart-text">${this.settings.stickyButton.text}</span>
      <span class="cart-count" style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 12px; display: none;">0</span>
    `;
    
    button.addEventListener('click', () => this.toggleDrawer());
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(button);
    this.stickyButton = button;
  }

  createCartDrawer() {
    // Inject minimal styles once for open/close transitions
    const styleId = 'scd-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .cart-drawer{pointer-events:none;}
        .cart-drawer.open{pointer-events:auto;}
        .cart-drawer-overlay{opacity:0;visibility:hidden;transition:all .3s ease;}
        .cart-drawer.open .cart-drawer-overlay{opacity:1;visibility:visible;}
        .cart-drawer-panel{position:fixed;top:0;right:0;width:380px;max-width:90vw;height:100%;background:#fff;transform:translateX(100%);transition:transform .3s ease;box-shadow:-4px 0 16px rgba(0,0,0,.15);display:flex;flex-direction:column;z-index:1;}
        .cart-drawer.open .cart-drawer-panel{transform:translateX(0);}
      `;
      document.head.appendChild(style);
    }

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
    `;

    drawer.innerHTML = `
      <div class="cart-drawer-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 0;
      "></div>
      <aside class="cart-drawer-panel">
        <div class="cart-drawer-header" style="
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Your Cart</h2>
          <button class="cart-drawer-close" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
        <div class="cart-drawer-body" style="flex: 1; overflow-y: auto; padding: 20px;">
          <div class="cart-items"></div>
          ${this.settings?.freeShipping?.enabled ? this.createFreeShippingBar() : ''}
          ${this.settings?.upsells?.enabled ? this.createUpsellsSection() : ''}
          ${this.settings?.addOns?.enabled ? this.createAddOnsSection() : ''}
          ${this.settings?.discountBar?.enabled ? this.createDiscountBar() : ''}
        </div>
        <div class="cart-drawer-footer" style="
          padding: 20px;
          border-top: 1px solid #eee;
          background: white;
        ">
          <div class="cart-total" style="margin-bottom: 15px;"></div>
          <button class="checkout-button" style="
            width: 100%;
            padding: 15px;
            background: ${this.settings?.themeColor || '#000000'};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s ease;
          ">Checkout</button>
        </div>
      </aside>
    `;

    document.body.appendChild(drawer);
    this.drawer = drawer;
    
    // Bind events
    drawer.querySelector('.cart-drawer-close').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.cart-drawer-overlay').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.checkout-button').addEventListener('click', (e) => { e.preventDefault(); this.goToCheckout(); });
  }

  createFreeShippingBar() {
    const threshold = this.settings?.freeShipping?.threshold || 50;
    return `
      <div class="free-shipping-bar" style="
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
      ">
        <div class="shipping-progress" style="
          width: 100%;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          margin-bottom: 8px;
          overflow: hidden;
        ">
          <div class="shipping-progress-bar" style="
            height: 100%;
            background: ${this.settings?.themeColor || '#000000'};
            width: 0%;
            transition: width 0.3s ease;
          "></div>
        </div>
        <div class="shipping-text" style="font-size: 14px; text-align: center;">
          Add ${this.formatCurrency(threshold)} for free shipping!
        </div>
      </div>
    `;
  }

  createUpsellsSection() {
    return `
      <div class="upsells-section" style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Frequently Bought Together</h3>
        <div class="upsells-grid"></div>
      </div>
    `;
  }

  createAddOnsSection() {
    return `
      <div class="addons-section" style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Add Protection</h3>
        <div class="addons-list"></div>
      </div>
    `;
  }

  createDiscountBar() {
    return `
      <div class="discount-bar" style="
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        display: flex;
        gap: 10px;
      ">
        <input type="text" class="discount-input" placeholder="Discount code" style="
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        ">
        <button class="discount-apply" style="
          padding: 10px 15px;
          background: ${this.settings?.themeColor || '#000000'};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">Apply</button>
      </div>
    `;
  }

  bindEvents() {
    // Intercept form submissions (Add to cart)
    document.addEventListener('submit', (e) => {
      if (e.target?.action?.includes('/cart/add')) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAddToCart(e.target);
      }
    });

    // Capture clicks early to stop theme default cart/drawer from opening
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const cartTrigger = target.closest('a[href="/cart"], a[href*="/cart"], [data-open-cart], .js-drawer-open-cart, #cart-icon-bubble, [data-drawer-target*="cart"], button[aria-controls*="Cart"], button[name="cart"]');
      if (cartTrigger) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        this.openDrawer();
      }
    }, true);

    // Bubble phase: intercept add-to-cart buttons
    document.addEventListener('click', (e) => {
      const addBtn = (e.target as HTMLElement).closest('[name="add"], .btn-add-to-cart, [data-add-to-cart], .add-to-cart, .product-form__cart-submit');
      if (addBtn) {
        const form = addBtn.closest('form');
        if (form?.action?.includes('/cart/add')) {
          e.preventDefault();
          this.handleAddToCart(form);
          return;
        }
      }
    });

    // Refresh settings/cart when returning to the tab
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await this.loadSettings();
        await this.loadCartData();
      }
    });
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
        this.trackEvent('add_to_cart');
      } else {
        throw new Error('Add to cart failed');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      // Fallback to normal form submission
      form.submit();
    }
  }

  updateUI() {
    if (!this.cartData) return;

    // Update sticky button
    if (this.stickyButton) {
      const countEl = this.stickyButton.querySelector('.cart-count');
      const textEl = this.stickyButton.querySelector('.cart-text');
      
      countEl.textContent = this.cartData.item_count || 0;
      countEl.style.display = (this.cartData.item_count || 0) > 0 ? 'block' : 'none';
      
      if (textEl && this.settings?.stickyButton?.text) {
        textEl.textContent = this.settings.stickyButton.text;
      }
    }

    // Update drawer content
    if (this.drawer) {
      this.updateCartItems();
      this.updateCartTotal();
      this.updateFreeShippingProgress();
      this.updateUpsells();
    }
  }

  updateCartItems() {
    const container = this.drawer?.querySelector('.cart-items');
    if (!container || !this.cartData?.items) return;

    if (this.cartData.items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
          <p>Your cart is empty</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.cartData.items.map(item => `
      <div class="cart-item" data-key="${item.key}" style="
        display: flex;
        gap: 12px;
        padding: 15px 0;
        border-bottom: 1px solid #eee;
      ">
        <div class="item-image" style="flex-shrink: 0;">
          <img src="${item.featured_image?.url || ''}" alt="${item.title}" style="
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
          ">
        </div>
        <div class="item-details" style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; line-height: 1.3;">${item.title}</h4>
          ${item.variant_title ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">${item.variant_title}</div>` : ''}
          <div style="font-size: 14px; font-weight: 600;">${this.formatCurrency(item.price / 100)}</div>
        </div>
        <div class="item-controls" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: end; gap: 8px;">
          <div class="quantity-controls" style="display: flex; align-items: center; gap: 8px;">
            <button class="qty-btn qty-decrease" data-key="${item.key}" style="
              width: 30px;
              height: 30px;
              border: 1px solid #ddd;
              background: white;
              cursor: pointer;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">−</button>
            <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
            <button class="qty-btn qty-increase" data-key="${item.key}" style="
              width: 30px;
              height: 30px;
              border: 1px solid #ddd;
              background: white;
              cursor: pointer;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">+</button>
          </div>
          <button class="item-remove" data-key="${item.key}" style="
            color: #dc3545;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
          ">Remove</button>
        </div>
      </div>
    `).join('');

    // Bind quantity events (delegate once)
    container.onclick = (e) => {
      const target = e.target;
      const key = target?.dataset?.key;
      if (!key) return;

      if (target.classList.contains('qty-increase')) {
        this.updateQuantity(key, 1);
      } else if (target.classList.contains('qty-decrease')) {
        this.updateQuantity(key, -1);
      } else if (target.classList.contains('item-remove')) {
        this.removeItem(key);
      }
    };
  }

  updateCartTotal() {
    const totalEl = this.drawer?.querySelector('.cart-total');
    if (!totalEl || !this.cartData) return;

    totalEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 600;">
        <span>Subtotal:</span>
        <span>${this.formatCurrency(this.cartData.total_price / 100)}</span>
      </div>
    `;
  }

  updateFreeShippingProgress() {
    if (!this.settings?.freeShipping?.enabled) return;

    const progressBar = this.drawer?.querySelector('.shipping-progress-bar');
    const shippingText = this.drawer?.querySelector('.shipping-text');
    
    if (!progressBar || !shippingText || !this.cartData) return;

    const threshold = (this.settings.freeShipping.threshold || 50) * 100; // Convert to cents
    const currentTotal = this.cartData.total_price || 0;
    const progress = Math.min((currentTotal / threshold) * 100, 100);
    const remaining = Math.max((threshold - currentTotal) / 100, 0);

    progressBar.style.width = `${progress}%`;
    
    if (remaining > 0) {
      shippingText.textContent = `Add ${this.formatCurrency(remaining)} for free shipping!`;
    } else {
      shippingText.textContent = '🎉 You qualify for free shipping!';
    }
  }

  updateUpsells() {
    if (!this.settings?.upsells?.enabled || !this.upsellProducts?.length) return;

    const upsellsGrid = this.drawer?.querySelector('.upsells-grid');
    if (!upsellsGrid) return;

    upsellsGrid.innerHTML = this.upsellProducts.slice(0, 3).map(product => `
      <div class="upsell-item" style="
        display: flex;
        gap: 12px;
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 6px;
        margin-bottom: 8px;
      ">
        <img src="${product.product_image_url || ''}" alt="${product.product_title}" style="
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
        ">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 500;">${product.product_title}</h4>
          <div style="font-size: 12px; font-weight: 600;">${this.formatCurrency(product.product_price)}</div>
        </div>
        <button class="add-upsell" data-id="${product.product_id}" style="
          padding: 6px 12px;
          background: ${this.settings.themeColor || '#000000'};
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Add</button>
      </div>
    `).join('');
  }

  async updateQuantity(key, change) {
    const item = this.cartData?.items?.find(item => item.key === key);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);
    
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: newQuantity })
      });
      
      if (response.ok) {
        await this.loadCartData();
        this.trackEvent('quantity_update');
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  }

  async removeItem(key) {
    await this.updateQuantity(key, -999);
    this.trackEvent('item_remove');
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  openDrawer() {
    if (!this.drawer) return;

    this.drawer.classList.add('open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-sticky-cart-open', 'true');
    
    this.trackEvent('cart_open');
  }

  closeDrawer() {
    if (!this.drawer) return;

    this.drawer.classList.remove('open');
    this.isOpen = false;
    document.body.style.overflow = '';
    document.body.removeAttribute('data-sticky-cart-open');
  }

  goToCheckout() {
    this.trackEvent('checkout_click');
    window.location.href = '/checkout';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StickyCartDrawer());
} else {
  new StickyCartDrawer();
}