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
    // Block native cart interactions immediately
    this.blockNativeCart();
    
    if (!this.shopDomain || !this.shopDomain.endsWith('.myshopify.com')) {
      console.warn('[Sticky Cart] Invalid shop domain, cart drawer disabled');
      return;
    }

    // Load all data in parallel
    console.log('[Sticky Cart] Loading configuration and data...');
    await Promise.all([
      this.loadSettings(),
      this.loadShopData(),
      this.loadUpsells(),
      this.loadAddOns()
    ]);
    
    if (!this.settings?.cartDrawerEnabled) {
      console.log('[Sticky Cart] Cart drawer disabled in settings');
      return;
    }
    
    // Initialize components
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    this.exposeGlobalMethods();
    
    // Load initial cart data
    await this.loadCartData();
    
    console.log('[Sticky Cart] Initialization complete!');
  }

  blockNativeCart() {
    // More comprehensive native cart blocking
    const style = document.createElement('style');
    style.id = 'sticky-cart-native-blocker';
    style.textContent = `
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
      
      /* Block cart redirects */
      body.cart-loading * {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // Enhanced cart button blocking
    document.addEventListener('click', (e) => {
      const target = e.target.closest(`
        a[href*="/cart"], a[href="/cart"], [data-cart-drawer], [data-cart-modal], 
        .cart-link, .cart-icon, .cart-button, .cart-toggle, .header-cart,
        [class*="cart-"], [id*="cart-"], .js-cart, .ajax-cart-trigger,
        .cart-opener, .open-cart, .show-cart, .toggle-cart
      `);
      
      if (target && !target.classList.contains('sticky-cart-btn') && !target.closest('.sticky-cart-drawer')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[Sticky Cart] Blocked native cart interaction, opening our drawer');
        this.openDrawer();
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
      
      // Use the app proxy to get settings from Supabase
      const response = await fetch(`https://${this.shopDomain}/tools/cart-drawer/settings?shop=${this.shopDomain}`, {
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
        throw new Error(`HTTP ${response.status}`);
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
      // Try multiple approaches to get shop currency
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
      console.log('[Sticky Cart] Could not load shop data, using defaults');
      this.shopCurrency = 'USD';
    }
  }

  async loadUpsells() {
    try {
      console.log('[Sticky Cart] Loading upsells...');
      const response = await fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/upsells`, {
        method: 'GET',
        headers: {
          'x-shop-domain': this.shopDomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.upsellProducts = data.products || [];
        console.log('[Sticky Cart] Loaded upsells:', this.upsellProducts.length);
      }
    } catch (error) {
      console.error('[Sticky Cart] Error loading upsells:', error);
      this.upsellProducts = [];
    }
  }

  async loadAddOns() {
    try {
      console.log('[Sticky Cart] Loading add-ons...');
      const response = await fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/addons`, {
        method: 'GET',
        headers: {
          'x-shop-domain': this.shopDomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.addOnProducts = data.products || [];
        
        // Auto-select default add-ons
        this.addOnProducts.forEach(addon => {
          if (addon.default_selected) {
            this.selectedAddOns.add(addon.product_id);
          }
        });
        
        console.log('[Sticky Cart] Loaded add-ons:', this.addOnProducts.length);
      }
    } catch (error) {
      console.error('[Sticky Cart] Error loading add-ons:', error);
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
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span class="cart-count">0</span>
      <span class="cart-text">${this.settings.stickyButtonText || 'Cart'}</span>
    `;
    
    const position = this.settings.stickyButtonPosition || 'bottom-right';
    const themeColor = this.settings.themeColor || '#000000';
    
    const styles = `
      position: fixed;
      z-index: 999999;
      background: ${themeColor};
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
      ${this.getPositionStyles(position)}
    `;
    
    button.style.cssText = styles;
    
    // Hover effects
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
    
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      ${position}: -420px;
      width: 420px;
      max-width: 90vw;
      height: 100vh;
      background: #ffffff;
      z-index: 1000000;
      transition: ${position} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: ${position === 'left' ? '4px' : '-4px'} 0 25px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-${position === 'left' ? 'right' : 'left'}: 2px solid ${themeColor}20;
    `;

    drawer.innerHTML = this.getDrawerHTML(themeColor);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sticky-cart-overlay';
    overlay.style.cssText = `
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
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    
    this.cartDrawer = drawer;
    this.cartOverlay = overlay;
    this.drawerPosition = position;
  }

  getDrawerHTML(themeColor) {
    return `
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
          <button class="checkout-btn" style="width: 100%; padding: 16px; background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px ${themeColor}40;">
            Proceed to Checkout
          </button>
          <button class="continue-shopping-btn" style="width: 100%; padding: 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;">
            Continue Shopping
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Close button
    this.cartDrawer.querySelector('.close-btn').addEventListener('click', () => this.closeDrawer());
    
    // Continue shopping
    this.cartDrawer.querySelector('.continue-shopping-btn').addEventListener('click', () => this.closeDrawer());
    
    // Overlay click
    this.cartOverlay.addEventListener('click', () => this.closeDrawer());
    
    // Checkout button
    this.cartDrawer.querySelector('.checkout-btn').addEventListener('click', () => {
      const checkoutUrl = this.buildCheckoutUrl();
      window.location.href = checkoutUrl;
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDrawer();
      }
    });

    // Hover effects for checkout button
    const checkoutBtn = this.cartDrawer.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('mouseenter', () => {
      checkoutBtn.style.transform = 'translateY(-2px)';
      checkoutBtn.style.boxShadow = `0 8px 20px ${this.settings?.themeColor || '#000000'}60`;
    });
    checkoutBtn.addEventListener('mouseleave', () => {
      checkoutBtn.style.transform = 'translateY(0)';
      checkoutBtn.style.boxShadow = `0 4px 12px ${this.settings?.themeColor || '#000000'}40`;
    });
  }

  buildCheckoutUrl() {
    let url = `/checkout`;
    
    // Add selected upsells and add-ons to checkout
    const additionalItems = [];
    
    this.selectedUpsells.forEach(productId => {
      additionalItems.push(productId);
    });
    
    this.selectedAddOns.forEach(productId => {
      additionalItems.push(productId);
    });
    
    return url;
  }

  openDrawer() {
    this.isOpen = true;
    this.cartDrawer.style[this.drawerPosition] = '0px';
    this.cartOverlay.style.opacity = '1';
    this.cartOverlay.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
    
    // Refresh cart data
    this.loadCartData();
    
    // Analytics
    this.trackEvent('cart_drawer_opened');
  }

  closeDrawer() {
    this.isOpen = false;
    this.cartDrawer.style[this.drawerPosition] = '-420px';
    this.cartOverlay.style.opacity = '0';
    this.cartOverlay.style.visibility = 'hidden';
    document.body.style.overflow = '';
  }

  updateStickyButtonCount() {
    if (!this.stickyButton || !this.cartData) return;
    
    const countElement = this.stickyButton.querySelector('.cart-count');
    const textElement = this.stickyButton.querySelector('.cart-text');
    const totalItems = this.cartData.item_count || 0;
    
    countElement.textContent = totalItems;
    countElement.style.display = totalItems > 0 ? 'inline' : 'none';
    
    if (totalItems > 0) {
      textElement.textContent = `Cart (${totalItems})`;
    } else {
      textElement.textContent = this.settings?.stickyButtonText || 'Cart';
    }
    
    // Animate button when items are added
    if (this.lastItemCount !== undefined && totalItems > this.lastItemCount) {
      this.animateButton();
    }
    this.lastItemCount = totalItems;
  }

  animateButton() {
    if (!this.stickyButton) return;
    
    this.stickyButton.style.animation = 'bounce 0.6s ease';
    setTimeout(() => {
      this.stickyButton.style.animation = '';
    }, 600);
    
    // Add bounce keyframes if not exists
    if (!document.getElementById('sticky-cart-animations')) {
      const style = document.createElement('style');
      style.id = 'sticky-cart-animations';
      style.textContent = `
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          80% { transform: translateY(-5px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateCartDisplay() {
    if (!this.cartData) return;
    
    this.updateFreeShippingBar();
    this.updateCartItems();
    this.updateUpsells();
    this.updateAddOns();
    this.updateTotal();
    this.updateDiscountSection();
    this.updateAnnouncement();
  }

  updateFreeShippingBar() {
    const container = this.cartDrawer.querySelector('.free-shipping-section');
    if (!this.settings?.freeShippingEnabled) {
      container.style.display = 'none';
      return;
    }
    
    const threshold = (this.settings.freeShippingThreshold || 50) * 100;
    const current = this.getEnhancedTotal() * 100;
    const progress = Math.min((current / threshold) * 100, 100);
    const remaining = Math.max(0, (threshold - current) / 100);
    
    container.innerHTML = `
      <div style="margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 16px; border: 1px solid #bae6fd;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-weight: 600; color: #0c4a6e;">Free Shipping Progress</span>
          ${remaining > 0 ? 
            `<span style="color: #64748b; font-size: 14px;">${this.formatPrice(remaining)} remaining</span>` :
            `<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">🎉 Unlocked!</span>`
          }
        </div>
        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
          <div style="height: 100%; background: linear-gradient(90deg, #06b6d4, #22c55e); width: ${progress}%; transition: width 0.5s ease; border-radius: 4px;"></div>
        </div>
        <p style="margin: 0; font-size: 13px; color: #475569;">
          ${remaining > 0 ? 
            `Add ${this.formatPrice(remaining)} more for free shipping!` : 
            "You've qualified for free shipping! 🚚"
          }
        </p>
      </div>
    `;
    
    container.style.display = 'block';
  }

  updateCartItems() {
    const container = this.cartDrawer.querySelector('.cart-items');
    
    if (!this.cartData?.items?.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
          <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #374151;">Your cart is empty</h3>
          <p style="margin: 0; color: #6b7280;">Add some products to get started!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Cart Items (${this.cartData.items.length})</h3>
        ${this.cartData.items.map(item => this.renderCartItem(item)).join('')}
      </div>
    `;
  }

  renderCartItem(item) {
    return `
      <div class="cart-item" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
        <img src="${item.image}" alt="${item.title}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #111827; line-height: 1.4;">${item.title}</h4>
          ${item.variant_title ? `<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px;">${item.variant_title}</p>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="quantity-controls" style="display: flex; align-items: center; gap: 12px; background: #f9fafb; padding: 6px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <button onclick="window.stickyCartDrawer.updateQuantity('${item.key}', ${item.quantity - 1})" 
                style="width: 32px; height: 32px; border: none; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s ease;"
                onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">−</button>
              <span style="min-width: 24px; text-align: center; font-weight: 600; color: #374151;">${item.quantity}</span>
              <button onclick="window.stickyCartDrawer.updateQuantity('${item.key}', ${item.quantity + 1})" 
                style="width: 32px; height: 32px; border: none; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s ease;"
                onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'">+</button>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 16px; color: #111827;">${this.formatPrice(item.line_price / 100)}</div>
              ${item.quantity > 1 ? `<div style="font-size: 12px; color: #9ca3af;">${this.formatPrice(item.price / 100)} each</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateUpsells() {
    const container = this.cartDrawer.querySelector('.upsells-section');
    if (!this.settings?.upsellsEnabled || !this.upsellProducts.length) {
      container.style.display = 'none';
      return;
    }
    
    const relevantUpsells = this.upsellProducts.slice(0, 4);
    
    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Frequently bought together</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${relevantUpsells.map(product => this.renderUpsell(product)).join('')}
        </div>
      </div>
    `;
    
    container.style.display = 'block';
  }

  renderUpsell(product) {
    const isInCart = this.cartData?.items?.some(item => item.product_id.toString() === product.product_id);
    const isSelected = this.selectedUpsells.has(product.product_id);
    
    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: white;">
        <img src="${product.product_image_url || 'https://images.unsplash.com/photo-1563013544-824ae1b704b3?w=120&h=120&fit=crop'}" 
             alt="${product.product_title}" 
             style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #374151; line-height: 1.3;">${product.product_title}</h4>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #111827; font-size: 14px;">${this.formatPrice(product.product_price)}</span>
          <button onclick="window.stickyCartDrawer.toggleUpsell('${product.product_id}')"
            style="padding: 6px 12px; border: none; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; 
            ${isInCart ? 'background: #d1d5db; color: #6b7280;' : 
              isSelected ? 'background: #22c55e; color: white;' : 
              'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;'}"
            ${isInCart ? 'disabled' : ''}
            onmouseover="${!isInCart ? (isSelected ? 'this.style.background=\'#16a34a\'' : 'this.style.background=\'#e5e7eb\'') : ''}"
            onmouseout="${!isInCart ? (isSelected ? 'this.style.background=\'#22c55e\'' : 'this.style.background=\'#f3f4f6\'') : ''}">
            ${isInCart ? 'Added' : isSelected ? '✓ Added' : 'Add'}
          </button>
        </div>
      </div>
    `;
  }

  updateAddOns() {
    const container = this.cartDrawer.querySelector('.addons-section');
    if (!this.settings?.addOnsEnabled || !this.addOnProducts.length) {
      container.style.display = 'none';
      return;
    }
    
    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Protect your purchase</h3>
        ${this.addOnProducts.map(addon => this.renderAddOn(addon)).join('')}
      </div>
    `;
    
    container.style.display = 'block';
  }

  renderAddOn(addon) {
    const isSelected = this.selectedAddOns.has(addon.product_id);
    
    return `
      <label style="display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px; background: ${isSelected ? '#eff6ff' : 'white'};"
        onmouseover="this.style.borderColor='${isSelected ? '#2563eb' : '#d1d5db'}'"
        onmouseout="this.style.borderColor='${isSelected ? '#3b82f6' : '#e5e7eb'}'">
        <input type="checkbox" 
               style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;"
               ${isSelected ? 'checked' : ''}
               onchange="window.stickyCartDrawer.toggleAddOn('${addon.product_id}', this.checked)">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${addon.product_title}</div>
          <div style="font-size: 14px; font-weight: 600; color: #059669;">+${this.formatPrice(addon.product_price)}</div>
          ${addon.description ? `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${addon.description}</div>` : ''}
        </div>
      </label>
    `;
  }

  updateDiscountSection() {
    const container = this.cartDrawer.querySelector('.discount-section');
    if (!this.settings?.discountBarEnabled) {
      container.style.display = 'none';
      return;
    }
    
    container.innerHTML = `
      <div style="margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; border: 1px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-weight: 600; color: #92400e;">Have a discount code?</span>
          ${this.settings.discountCode ? `<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${this.settings.discountCode}</span>` : ''}
        </div>
        <button style="width: 100%; padding: 10px; background: white; border: 1px solid #d97706; border-radius: 8px; color: #92400e; font-weight: 500; cursor: pointer; transition: all 0.2s ease;"
          onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='white'">
          Apply Discount Code
        </button>
      </div>
    `;
    
    container.style.display = 'block';
  }

  updateAnnouncement() {
    const container = this.cartDrawer.querySelector('.announcement-section');
    if (!this.settings?.announcementText) {
      container.style.display = 'none';
      return;
    }
    
    container.innerHTML = `
      <div style="margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; border: 1px solid #0ea5e9; text-align: center;">
        <p style="margin: 0; color: #0c4a6e; font-weight: 500;">${this.settings.announcementText}</p>
      </div>
    `;
    
    container.style.display = 'block';
  }

  updateTotal() {
    const totalElement = this.cartDrawer.querySelector('.total-price');
    const enhancedTotal = this.getEnhancedTotal();
    totalElement.textContent = this.formatPrice(enhancedTotal);
  }

  getEnhancedTotal() {
    let total = (this.cartData?.total_price || 0) / 100;
    
    // Add selected upsells
    this.selectedUpsells.forEach(productId => {
      const upsell = this.upsellProducts.find(u => u.product_id === productId);
      if (upsell) {
        total += parseFloat(upsell.product_price) || 0;
      }
    });
    
    // Add selected add-ons
    this.selectedAddOns.forEach(productId => {
      const addon = this.addOnProducts.find(a => a.product_id === productId);
      if (addon) {
        total += parseFloat(addon.product_price) || 0;
      }
    });
    
    return total;
  }

  formatPrice(amount) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.shopCurrency || 'USD'
    });
    return formatter.format(amount);
  }

  toggleUpsell(productId) {
    if (this.selectedUpsells.has(productId)) {
      this.selectedUpsells.delete(productId);
    } else {
      this.selectedUpsells.add(productId);
    }
    this.updateUpsells();
    this.updateTotal();
  }

  toggleAddOn(productId, checked) {
    if (checked) {
      this.selectedAddOns.add(productId);
    } else {
      this.selectedAddOns.delete(productId);
    }
    this.updateTotal();
  }

  async updateQuantity(key, quantity) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: Math.max(0, quantity) })
      });
      
      if (response.ok) {
        await this.loadCartData();
        this.showNotification(quantity === 0 ? 'Item removed from cart' : 'Cart updated');
      }
    } catch (error) {
      console.error('[Sticky Cart] Error updating quantity:', error);
    }
  }

  showNotification(message) {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInNotification 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutNotification 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
    
    // Add notification styles if not exist
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInNotification {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutNotification {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  trackEvent(eventType, data = {}) {
    try {
      fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: this.shopDomain,
          event_type: eventType,
          event_data: {
            ...data,
            total: this.cartData?.total_price || 0,
            item_count: this.cartData?.item_count || 0
          }
        })
      });
    } catch (error) {
      console.log('[Sticky Cart] Analytics tracking failed:', error);
    }
  }

  exposeGlobalMethods() {
    window.stickyCartDrawer = this;
    
    // Listen for cart updates
    document.addEventListener('cart:updated', () => {
      this.loadCartData();
    });
    
    // Listen for Shopify theme cart updates
    if (window.Shopify?.theme) {
      document.addEventListener('variant:change', () => {
        setTimeout(() => this.loadCartData(), 100);
      });
    }
  }
}

// Initialize when DOM is ready
console.log('[Sticky Cart] Script loaded');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Sticky Cart] DOM ready, initializing...');
    new StickyCartDrawer();
  });
} else {
  console.log('[Sticky Cart] DOM already ready, initializing immediately...');
  new StickyCartDrawer();
}
