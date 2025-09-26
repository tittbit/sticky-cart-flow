/**
 * Sticky Cart Drawer
 * A modern, customizable cart drawer for Shopify stores
 */

(function() {
  'use strict';

  // Default configuration
  let config = {
    enabled: true,
    stickyButton: {
      enabled: true,
      position: 'bottom-right',
      text: 'Cart',
      showCount: true,
      backgroundColor: '#000000',
      textColor: '#ffffff'
    },
    cartDrawer: {
      enabled: true,
      position: 'right',
      width: '400px',
      showProductImages: true,
      showQuantitySelector: true,
      showRemoveButton: true
    },
    freeShipping: {
      enabled: false,
      threshold: 100,
      message: 'Free shipping on orders over ${threshold}!'
    },
    upsells: {
      enabled: false,
      products: []
    },
    addons: {
      enabled: false,
      products: []
    },
    analytics: {
      enabled: false,
      googleAnalyticsId: null,
      facebookPixelId: null
    }
  };

  // Cart state
  let cartData = null;
  let isDrawerOpen = false;

  async loadSettings() {
    try {
      const response = await fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/storage/v1/object/public/cart-settings/${this.shopDomain}-settings.js`);
      if (response.ok) {
        const settingsData = await response.text();
        // Extract settings from the JS file
        const settingsMatch = settingsData.match(/window\.CART_DRAWER_SETTINGS\s*=\s*({[\s\S]*?});/);
        if (settingsMatch) {
          this.settings = JSON.parse(settingsMatch[1]);
        } else {
          throw new Error('Settings format invalid');
        }
      } else {
        throw new Error('Settings not found');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.loadFallbackSettings();
    }
  }

  loadFallbackSettings() {
    this.settings = {
      cartDrawer: {
        enabled: true,
        position: 'right',
        theme: 'auto',
        showOnDesktop: true,
        showOnMobile: true,
        animation: 'slide'
      },
      stickyButton: {
        enabled: true,
        position: 'bottom-right',
        text: 'Cart',
        showCount: true,
        showPrice: true,
        icon: 'cart',
        size: 'md',
        color: '#007bff'
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

  async loadCart() {
    try {
      const response = await fetch('/cart.js');
      this.cart = await response.json();
    } catch (error) {
      console.error('Failed to load cart:', error);
      this.cart = { items: [], total_price: 0, item_count: 0 };
    }
  }

  createStickyButton() {
    if (!this.settings.stickyButton.enabled) return;

    // Remove existing button
    const existing = document.getElementById('sticky-cart-button');
    if (existing) existing.remove();

    const button = document.createElement('div');
    button.id = 'sticky-cart-button';
    button.className = `sticky-cart-button ${this.settings.stickyButton.position} ${this.settings.stickyButton.size}`;
    
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

    // Button content
    const icon = this.getCartIcon();
    const text = this.settings.stickyButton.text;
    const count = this.settings.stickyButton.showCount ? `<span class="cart-count">${this.cart.item_count}</span>` : '';
    const price = this.settings.stickyButton.showPrice ? `<span class="cart-price">$${(this.cart.total_price / 100).toFixed(2)}</span>` : '';

    button.innerHTML = `
      ${icon}
      <span class="button-text">${text}</span>
      ${count}
      ${price}
    `;

    // Animation
    if (this.settings.stickyButton.animation !== 'none') {
      button.classList.add(`animate-${this.settings.stickyButton.animation}`);
    }

    // Event listener
    button.addEventListener('click', () => this.openCartDrawer());

    // Add to page
    document.body.appendChild(button);

    // Add CSS animations
    this.addButtonAnimations();
  }

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

  createCartDrawer() {
    if (!this.settings.cartDrawer.enabled) return;

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
          ${this.renderUpsells()}
          ${this.renderAddOns()}
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

  renderFreeShipping() {
    if (!this.settings.freeShipping.enabled) return '';
    
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

  renderUpsells() {
    if (!this.settings.upsells || this.settings.upsells.length === 0) return '';
    
    return `
      <div class="cart-upsells">
        <h4>You might also like</h4>
        <div class="upsell-products">
          ${this.settings.upsells.map(product => `
            <div class="upsell-product" data-id="${product.id}">
              <img src="${product.image}" alt="${product.title}" />
              <h5>${product.title}</h5>
              <p class="upsell-price">$${product.price}</p>
              <button class="add-upsell" onclick="window.stickyCartDrawer.addUpsell('${product.id}')">
                Add to Cart
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAddOns() {
    if (!this.settings.addons || this.settings.addons.length === 0) return '';
    
    return `
      <div class="cart-addons">
        <h4>Optional Add-ons</h4>
        <div class="addon-products">
          ${this.settings.addons.map(addon => `
            <div class="addon-product">
              <label class="addon-label">
                <input type="checkbox" 
                       ${addon.default_selected ? 'checked' : ''} 
                       onchange="window.stickyCartDrawer.toggleAddon('${addon.id}', this.checked)" />
                <span class="addon-info">
                  <strong>${addon.title}</strong> - $${addon.price}
                  ${addon.description ? `<br><small>${addon.description}</small>` : ''}
                </span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

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
        ${this.settings.cartDrawer.backdropBlur ? 'backdrop-filter: blur(4px);' : ''}
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
      
      .item-price {
        margin: 0;
        color: ${this.settings.design.primaryColor};
        font-weight: 600;
      }
      
      .item-controls {
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: center;
      }
      
      .qty-btn {
        background: #f5f5f5;
        border: 1px solid #ddd;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .qty-btn:hover {
        background: #e9e9e9;
      }
      
      .item-quantity {
        font-weight: 600;
        min-width: 20px;
        text-align: center;
      }
      
      .remove-btn {
        background: #ff4757;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .free-shipping-progress,
      .free-shipping-achieved {
        background: #f8f9fa;
        padding: 15px;
        border-radius: ${this.settings.design.borderRadius}px;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 10px;
      }
      
      .progress-fill {
        height: 100%;
        background: ${this.settings.design.primaryColor};
        transition: width 0.3s ease;
      }
      
      .cart-upsells,
      .cart-addons {
        margin-bottom: 20px;
      }
      
      .cart-upsells h4,
      .cart-addons h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .upsell-products {
        display: flex;
        gap: 10px;
        overflow-x: auto;
      }
      
      .upsell-product {
        min-width: 120px;
        text-align: center;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: ${this.settings.design.borderRadius}px;
      }
      
      .upsell-product img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .upsell-product h5 {
        margin: 0 0 5px 0;
        font-size: 12px;
        font-weight: 600;
      }
      
      .upsell-price {
        margin: 0 0 8px 0;
        color: ${this.settings.design.primaryColor};
        font-weight: 600;
        font-size: 12px;
      }
      
      .add-upsell {
        background: ${this.settings.design.primaryColor};
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .addon-products {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .addon-label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .addon-label input {
        margin-top: 2px;
      }
      
      .cart-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        background: #f8f9fa;
      }
      
      .cart-total {
        text-align: center;
        margin-bottom: 15px;
        font-size: 18px;
      }
      
      .checkout-button {
        width: 100%;
        background: ${this.settings.design.primaryColor};
        color: white;
        border: none;
        padding: 15px;
        border-radius: ${this.settings.design.borderRadius}px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.2s;
      }
      
      .checkout-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .empty-cart {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }
      
      @media (max-width: 768px) {
        .cart-panel {
          width: 100vw;
          max-width: 100vw;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Listen for cart updates
    document.addEventListener('cart:updated', () => {
      this.loadCart().then(() => {
        this.updateStickyButton();
        if (this.isOpen) {
          this.updateCartDrawer();
        }
      });
    });

    // Auto-open cart when items are added
    if (this.settings.cartDrawer.autoOpen) {
      document.addEventListener('cart:item-added', () => {
        this.openCartDrawer();
      });
    }
  }

  openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.add('open');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
      
      // Track analytics
      this.trackEvent('cart_drawer_opened', {
        item_count: this.cart.item_count,
        cart_value: this.cart.total_price / 100
      });
    }
  }

  closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.remove('open');
      this.isOpen = false;
      document.body.style.overflow = '';
      
      // Track analytics
      this.trackEvent('cart_drawer_closed', {
        item_count: this.cart.item_count,
        cart_value: this.cart.total_price / 100
      });
    }
  }

  async updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
      return this.removeItem(itemId);
    }

    try {
      const formData = new FormData();
      formData.append('id', itemId);
      formData.append('quantity', newQuantity);

      const response = await fetch('/cart/change.js', {
        method: 'POST',
        body: formData
      });

      const updatedCart = await response.json();
      this.cart = updatedCart;
      
      this.updateStickyButton();
      this.updateCartDrawer();
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: updatedCart }));
      
      // Track analytics
      this.trackEvent('cart_quantity_changed', {
        item_id: itemId,
        new_quantity: newQuantity,
        cart_value: this.cart.total_price / 100
      });
      
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  }

  async removeItem(itemId) {
    try {
      const formData = new FormData();
      formData.append('id', itemId);
      formData.append('quantity', 0);

      const response = await fetch('/cart/change.js', {
        method: 'POST',
        body: formData
      });

      const updatedCart = await response.json();
      this.cart = updatedCart;
      
      this.updateStickyButton();
      this.updateCartDrawer();
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: updatedCart }));
      
      // Track analytics
      this.trackEvent('cart_item_removed', {
        item_id: itemId,
        cart_value: this.cart.total_price / 100
      });
      
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }

  async addUpsell(productId) {
    try {
      const formData = new FormData();
      formData.append('id', productId);
      formData.append('quantity', 1);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      // Reload cart
      await this.loadCart();
      this.updateStickyButton();
      this.updateCartDrawer();
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('cart:item-added', { detail: result }));
      
      // Track analytics
      this.trackEvent('upsell_added', {
        product_id: productId,
        cart_value: this.cart.total_price / 100
      });
      
    } catch (error) {
      console.error('Failed to add upsell:', error);
    }
  }

  async toggleAddon(addonId, checked) {
    if (checked) {
      await this.addUpsell(addonId);
    } else {
      // Find addon in cart and remove
      const addonInCart = this.cart.items.find(item => item.product_id == addonId);
      if (addonInCart) {
        await this.removeItem(addonInCart.id);
      }
    }
    
    // Track analytics
    this.trackEvent('addon_toggled', {
      addon_id: addonId,
      checked: checked,
      cart_value: this.cart.total_price / 100
    });
  }

  updateStickyButton() {
    const button = document.getElementById('sticky-cart-button');
    if (!button) return;

    const countElement = button.querySelector('.cart-count');
    const priceElement = button.querySelector('.cart-price');
    
    if (countElement) {
      countElement.textContent = this.cart.item_count;
    }
    
    if (priceElement) {
      priceElement.textContent = `$${(this.cart.total_price / 100).toFixed(2)}`;
    }
  }

  updateCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    const header = drawer.querySelector('.cart-header h3');
    const content = drawer.querySelector('.cart-content');
    const total = drawer.querySelector('.cart-total');
    
    if (header) {
      header.textContent = `Your Cart (${this.cart.item_count})`;
    }
    
    if (content) {
      content.innerHTML = `
        ${this.renderCartItems()}
        ${this.renderFreeShipping()}
        ${this.renderUpsells()}
        ${this.renderAddOns()}
      `;
    }
    
    if (total) {
      total.innerHTML = `<strong>Total: $${(this.cart.total_price / 100).toFixed(2)}</strong>`;
    }
  }

  initAnalytics() {
    if (!this.settings.analytics.enableTracking) return;

    // Initialize Google Analytics
    if (this.settings.analytics.googleAnalyticsId) {
      this.initGoogleAnalytics();
    }

    // Initialize Facebook Pixel
    if (this.settings.analytics.facebookPixelId) {
      this.initFacebookPixel();
    }
  }

  initGoogleAnalytics() {
    const gaId = this.settings.analytics.googleAnalyticsId;
    
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', gaId);
    
    window.gtag = gtag;
  }

  initFacebookPixel() {
    const pixelId = this.settings.analytics.facebookPixelId;
    
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', pixelId);
    fbq('track', 'PageView');
  }

  trackEvent(eventName, eventData = {}) {
    if (!this.settings.analytics.enableTracking) return;

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        custom_parameter: eventData,
        value: eventData.cart_value || 0
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      const fbEventMap = {
        'cart_drawer_opened': 'InitiateCheckout',
        'cart_item_added': 'AddToCart',
        'upsell_added': 'AddToCart',
        'checkout_clicked': 'InitiateCheckout'
      };
      
      const fbEvent = fbEventMap[eventName] || 'CustomEvent';
      window.fbq('track', fbEvent, {
        value: eventData.cart_value || 0,
        currency: this.settings.freeShipping.currency || 'USD'
      });
    }

    // Send to Supabase analytics
    this.sendAnalytics(eventName, eventData);
  }

  async sendAnalytics(eventName, eventData) {
    try {
      await fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-domain': this.shopDomain
        },
        body: JSON.stringify({
          event_type: eventName,
          event_data: eventData,
          session_id: this.getSessionId(),
          user_agent: navigator.userAgent,
          cart_total: this.cart.total_price / 100,
          item_count: this.cart.item_count
        })
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.stickyCartDrawer = new StickyCartDrawer();
  });
} else {
  window.stickyCartDrawer = new StickyCartDrawer();
}