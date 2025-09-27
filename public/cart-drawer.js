/**
 * Sticky Cart Drawer
 * A modern, customizable cart drawer for Shopify stores
 */

(function() {
  'use strict';

  // Sticky Cart Drawer Class
  class StickyCartDrawer {
    constructor() {
      this.shopDomain = this.getShopDomain();
      this.settings = null;
      this.cart = null;
      this.isDrawerOpen = false;
      this.isInitialized = false;
    }

    // Get shop domain from various sources
    getShopDomain() {
      if (window.Shopify && window.Shopify.shop) {
        return window.Shopify.shop;
      }
      // Fallback to URL-based detection
      const hostname = window.location.hostname;
      if (hostname.includes('.myshopify.com')) {
        return hostname;
      }
      return hostname; // For custom domains
    }

    // Initialize the cart drawer
    async init(customSettings = null) {
      if (this.isInitialized) return;
      
      try {
        // Load settings
        if (customSettings) {
          this.settings = customSettings;
        } else {
          await this.loadSettings();
        }

        // Load initial cart data
        await this.loadCart();

        // Create UI elements
        this.createStickyButton();
        this.createCartDrawer();

        // Set up event listeners
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('[Sticky Cart Drawer] Initialized successfully');
      } catch (error) {
        console.error('[Sticky Cart Drawer] Failed to initialize:', error);
      }
    }

    // Load settings from server
    async loadSettings() {
      try {
        const response = await fetch(`/api/shop-config?shop=${this.shopDomain}`);
        if (response.ok) {
          this.settings = await response.json();
        } else {
          throw new Error('Settings not found');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        this.loadFallbackSettings();
      }
    }

    // Fallback settings when server is unavailable
    loadFallbackSettings() {
      this.settings = {
        enabled: true,
        cartDrawer: {
          enabled: true,
          position: 'right',
          theme: 'auto',
          showOnDesktop: true,
          showOnMobile: true,
          animation: 'slide',
          backdropBlur: true
        },
        stickyButton: {
          enabled: true,
          position: 'bottom-right',
          text: 'Cart',
          showCount: true,
          showPrice: true,
          icon: 'cart',
          size: 'md',
          color: '#007bff',
          animation: 'bounce'
        },
        freeShipping: {
          enabled: true,
          threshold: 75,
          message: 'Free shipping on orders over $75!',
          currency: 'USD'
        },
        design: {
          primaryColor: '#007bff',
          borderRadius: 8,
          fontFamily: 'Inter'
        },
        analytics: {
          enableTracking: false
        }
      };
    }

    // Load cart data from Shopify
    async loadCart() {
      try {
        const response = await fetch('/cart.js');
        this.cart = await response.json();
      } catch (error) {
        console.error('Failed to load cart:', error);
        this.cart = { items: [], total_price: 0, item_count: 0 };
      }
    }

    // Create sticky cart button
    createStickyButton() {
      if (!this.settings?.stickyButton?.enabled) return;

      // Remove existing button
      const existing = document.getElementById('sticky-cart-button');
      if (existing) existing.remove();

      const button = document.createElement('div');
      button.id = 'sticky-cart-button';
      button.className = `sticky-cart-button ${this.settings.stickyButton.position} ${this.settings.stickyButton.size}`;
      
      // Apply styles
      this.applyButtonStyles(button);

      // Button content
      button.innerHTML = this.getButtonContent();

      // Event listener
      button.addEventListener('click', () => this.openCartDrawer());

      // Add to page
      document.body.appendChild(button);

      // Add CSS animations
      this.addButtonAnimations();
    }

    // Apply styles to button
    applyButtonStyles(button) {
      const styles = `
        position: fixed;
        z-index: 9999;
        background: ${this.settings.stickyButton.color};
        color: white;
        border: none;
        border-radius: ${this.settings.design.borderRadius}px;
        padding: 12px 16px;
        cursor: pointer;
        font-family: ${this.settings.design.fontFamily}, sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 80px;
      `;

      // Position styles
      const positionMap = {
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;',
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;'
      };

      button.style.cssText = styles + positionMap[this.settings.stickyButton.position];
    }

    // Get button content HTML
    getButtonContent() {
      const icon = this.getCartIcon();
      const text = this.settings.stickyButton.text;
      const count = this.settings.stickyButton.showCount ? `<span class="cart-count">${this.cart.item_count}</span>` : '';
      const price = this.settings.stickyButton.showPrice ? `<span class="cart-price">$${(this.cart.total_price / 100).toFixed(2)}</span>` : '';

      return `
        ${icon}
        <span class="button-text">${text}</span>
        ${count}
        ${price}
      `;
    }

    // Get cart icon SVG
    getCartIcon() {
      const iconMap = {
        cart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
        </svg>`,
        bag: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7H16V6C16 3.24 13.76 1 11 1S6 3.24 6 6V7H5C3.9 7 3 7.9 3 9V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V9C21 7.9 20.1 7 19 7ZM8 6C8 4.34 9.34 3 11 3S14 4.34 14 6V7H8V6ZM19 20H5V9H6V11C6 11.55 6.45 12 7 12S8 11.55 8 12V11H16V11C16 11.55 16.45 12 17 12S18 11.55 18 12V11H19V20Z"/>
        </svg>`,
        basket: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.21 9L14.83 2.09C14.66 1.64 14.22 1.34 13.74 1.34H10.26C9.78 1.34 9.34 1.64 9.17 2.09L6.79 9H2C1.45 9 1 9.45 1 10S1.45 11 2 11H3.18L4.69 19.47C4.89 20.87 6.08 21.87 7.5 21.87H16.5C17.92 21.87 19.11 20.87 19.31 19.47L20.82 11H22C22.55 11 23 10.55 23 10S22.55 9 22 9H17.21ZM11.24 3.34H12.76L14.41 9H9.59L11.24 3.34ZM17.31 19.15C17.26 19.42 17.03 19.61 16.75 19.61H7.25C6.97 19.61 6.74 19.42 6.69 19.15L5.32 11H18.68L17.31 19.15Z"/>
        </svg>`
      };
      return iconMap[this.settings.stickyButton.icon] || iconMap.cart;
    }

    // Add button animations CSS
    addButtonAnimations() {
      if (document.getElementById('cart-button-animations')) return;

      const style = document.createElement('style');
      style.id = 'cart-button-animations';
      style.textContent = `
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0,-8px,0); }
          70% { transform: translate3d(0,-4px,0); }
          90% { transform: translate3d(0,-2px,0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-bounce:hover { animation: bounce 0.6s ease-in-out; }
        .animate-pulse:hover { animation: pulse 1s infinite; }
        .animate-shake:hover { animation: shake 0.5s ease-in-out; }
        
        #sticky-cart-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
      `;
      document.head.appendChild(style);
    }

    // Create cart drawer
    createCartDrawer() {
      if (!this.settings?.cartDrawer?.enabled) return;

      // Remove existing drawer
      const existing = document.getElementById('cart-drawer');
      if (existing) existing.remove();

      const drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.className = `cart-drawer ${this.settings.cartDrawer.position}`;
      
      drawer.innerHTML = `
        <div class="cart-backdrop" onclick="window.stickyCartDrawer.closeCartDrawer()"></div>
        <div class="cart-panel">
          <div class="cart-header">
            <h3>Your Cart (${this.cart.item_count})</h3>
            <button class="cart-close" onclick="window.stickyCartDrawer.closeCartDrawer()">×</button>
          </div>
          <div class="cart-content">
            ${this.renderCartItems()}
            ${this.renderFreeShipping()}
          </div>
          <div class="cart-footer">
            <div class="cart-total">
              <strong>Total: $${(this.cart.total_price / 100).toFixed(2)}</strong>
            </div>
            <button class="checkout-button" onclick="window.location.href='/checkout'">
              Checkout
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(drawer);
      this.addDrawerStyles();
    }

    // Render cart items
    renderCartItems() {
      if (this.cart.items.length === 0) {
        return '<div class="empty-cart"><p>Your cart is empty</p></div>';
      }

      return `
        <div class="cart-items">
          ${this.cart.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
              <div class="item-image">
                <img src="${item.image}" alt="${item.title}" />
              </div>
              <div class="item-details">
                <h4>${item.title}</h4>
                <p class="item-price">$${(item.price / 100).toFixed(2)}</p>
              </div>
              <div class="item-controls">
                <button class="qty-btn" onclick="window.stickyCartDrawer.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="qty-btn" onclick="window.stickyCartDrawer.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                <button class="remove-btn" onclick="window.stickyCartDrawer.removeItem(${item.id})">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Render free shipping progress
    renderFreeShipping() {
      if (!this.settings?.freeShipping?.enabled) return '';
      
      const threshold = this.settings.freeShipping.threshold * 100; // Convert to cents
      const current = this.cart.total_price;
      const remaining = Math.max(0, threshold - current);
      const progress = Math.min(100, (current / threshold) * 100);

      if (remaining > 0) {
        return `
          <div class="free-shipping-progress">
            <p>Add $${(remaining / 100).toFixed(2)} more for free shipping!</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="free-shipping-achieved">
            <p>🎉 You qualify for free shipping!</p>
          </div>
        `;
      }
    }

    // Add drawer styles
    addDrawerStyles() {
      if (document.getElementById('cart-drawer-styles')) return;

      const style = document.createElement('style');
      style.id = 'cart-drawer-styles';
      style.textContent = `
        #cart-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        #cart-drawer.open {
          opacity: 1;
          visibility: visible;
        }
        
        .cart-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          ${this.settings?.cartDrawer?.backdropBlur ? 'backdrop-filter: blur(4px);' : ''}
        }
        
        .cart-panel {
          position: absolute;
          top: 0;
          ${this.settings.cartDrawer.position}: 0;
          width: 400px;
          max-width: 90vw;
          height: 100%;
          background: white;
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          transform: translateX(${this.settings.cartDrawer.position === 'right' ? '100%' : '-100%'});
          transition: transform 0.3s ease;
          font-family: ${this.settings.design.fontFamily}, sans-serif;
        }
        
        #cart-drawer.open .cart-panel {
          transform: translateX(0);
        }
        
        .cart-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${this.settings.design.primaryColor};
          color: white;
        }
        
        .cart-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .cart-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        
        .cart-close:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .cart-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .cart-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          background: #f9f9f9;
        }
        
        .cart-total {
          margin-bottom: 15px;
          text-align: center;
          font-size: 18px;
        }
        
        .checkout-button {
          width: 100%;
          padding: 12px;
          background: ${this.settings.design.primaryColor};
          color: white;
          border: none;
          border-radius: ${this.settings.design.borderRadius}px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .checkout-button:hover {
          opacity: 0.9;
        }
        
        .empty-cart {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .cart-items {
          margin-bottom: 20px;
        }
        
        .cart-item {
          display: flex;
          gap: 12px;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        
        .item-image img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: ${this.settings.design.borderRadius}px;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-details h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .qty-btn {
          width: 30px;
          height: 30px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .remove-btn {
          color: #e74c3c;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          font-size: 12px;
        }
        
        .free-shipping-progress {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: ${this.settings.design.borderRadius}px;
          text-align: center;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: ${this.settings.design.primaryColor};
          transition: width 0.3s ease;
        }
        
        .free-shipping-achieved {
          margin: 20px 0;
          padding: 15px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: ${this.settings.design.borderRadius}px;
          text-align: center;
          color: #155724;
        }
      `;
      document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
      // Listen for cart updates
      document.addEventListener('cart:updated', () => {
        this.loadCart().then(() => {
          this.updateUI();
        });
      });

      // Keyboard support
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isDrawerOpen) {
          this.closeCartDrawer();
        }
      });
    }

    // Open cart drawer
    openCartDrawer() {
      if (!this.settings?.cartDrawer?.enabled) return;
      
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.add('open');
        this.isDrawerOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Track analytics
        this.trackEvent('cart_drawer_opened');
      }
    }

    // Close cart drawer
    closeCartDrawer() {
      const drawer = document.getElementById('cart-drawer');
      if (drawer) {
        drawer.classList.remove('open');
        this.isDrawerOpen = false;
        document.body.style.overflow = '';
        
        // Track analytics
        this.trackEvent('cart_drawer_closed');
      }
    }

    // Update quantity
    async updateQuantity(itemId, quantity) {
      if (quantity < 1) {
        await this.removeItem(itemId);
        return;
      }

      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: itemId,
            quantity: quantity
          })
        });

        if (response.ok) {
          await this.loadCart();
          this.updateUI();
          this.trackEvent('cart_item_quantity_changed', { itemId, quantity });
        }
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    }

    // Remove item
    async removeItem(itemId) {
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: itemId,
            quantity: 0
          })
        });

        if (response.ok) {
          await this.loadCart();
          this.updateUI();
          this.trackEvent('cart_item_removed', { itemId });
        }
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    }

    // Update UI elements
    updateUI() {
      this.createStickyButton();
      if (this.isDrawerOpen) {
        this.createCartDrawer();
        this.openCartDrawer();
      }
    }

    // Track analytics events
    trackEvent(eventName, data = {}) {
      if (!this.settings?.analytics?.enableTracking) return;

      // Google Analytics
      if (this.settings.analytics.googleAnalyticsId && window.gtag) {
        window.gtag('event', eventName, {
          ...data,
          custom_parameter_shop: this.shopDomain
        });
      }

      // Facebook Pixel
      if (this.settings.analytics.facebookPixelId && window.fbq) {
        window.fbq('trackCustom', eventName, data);
      }

      console.log('[Analytics]', eventName, data);
    }
  }

  // Initialize when DOM is ready
  function initializeStickyCartDrawer() {
    window.stickyCartDrawer = new StickyCartDrawer();
    window.stickyCartDrawer.init();
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStickyCartDrawer);
  } else {
    initializeStickyCartDrawer();
  }

  // Expose for external use
  window.StickyCartDrawer = StickyCartDrawer;

})();