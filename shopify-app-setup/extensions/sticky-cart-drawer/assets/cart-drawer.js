/**
 * Sticky Cart Drawer - Main JavaScript
 * Handles cart drawer functionality, upsells, and cross-sells
 */

class StickyCartDrawer {
  constructor() {
    this.isOpen = false;
    this.settings = null;
    this.cartData = null;
    
    this.init();
  }

  async init() {
    // Load settings from app proxy
    await this.loadSettings();
    
    if (!this.settings?.enabled) return;
    
    // Initialize components
    this.createStickyButton();
    this.createCartDrawer();
    this.bindEvents();
    
    // Load initial cart data
    await this.loadCartData();
  }

  async loadSettings() {
    try {
      // Check if cart drawer is enabled from theme extension
      if (!window.CART_DRAWER_ENABLED) {
        this.settings = { enabled: false };
        return;
      }

      // Load settings from Supabase via proxy
      const shopDomain = window.SHOP_DOMAIN || window.location.hostname;
      const response = await fetch('/tools/cart-drawer/settings?shop=' + encodeURIComponent(shopDomain), { 
        headers: { 'Cache-Control': 'no-store' } 
      });
      
      if (!response.ok) throw new Error('Settings fetch failed');
      this.settings = await response.json();
    } catch (error) {
      console.error('Failed to load cart drawer settings:', error);
      // Fallback defaults
      this.settings = {
        enabled: true,
        stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
        freeShipping: { enabled: true, threshold: 50 },
        upsells: { enabled: false },
        addOns: { enabled: false },
        discountBar: { enabled: false },
      };
    }
  }

  async loadCartData() {
    try {
      const response = await fetch('/cart.js');
      this.cartData = await response.json();
      this.updateUI();
    } catch (error) {
      console.error('Failed to load cart data:', error);
    }
  }

  createStickyButton() {
    if (!this.settings.stickyButton?.enabled) return;

    const button = document.createElement('button');
    button.className = 'sticky-cart-button';
    button.innerHTML = `
      <span class="cart-icon">🛒</span>
      <span class="cart-text">${this.settings.stickyButton.text || 'Cart'}</span>
      <span class="cart-count">0</span>
    `;
    
    // Position based on settings
    const position = this.settings.stickyButton.position || 'bottom-right';
    button.classList.add(`position-${position}`);
    
    button.addEventListener('click', () => this.toggleDrawer());
    
    document.body.appendChild(button);
    this.stickyButton = button;
  }

  createCartDrawer() {
    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cart-drawer-overlay"></div>
      <div class="cart-drawer-content">
        <div class="cart-drawer-header">
          <h2>Your Cart</h2>
          <button class="cart-drawer-close">×</button>
        </div>
        <div class="cart-drawer-body">
          <div class="cart-items"></div>
          ${this.settings.freeShipping?.enabled ? this.createFreeShippingBar() : ''}
          ${this.settings.upsells?.enabled ? this.createUpsellsSection() : ''}
          ${this.settings.addOns?.enabled ? this.createAddOnsSection() : ''}
          ${this.settings.discountBar?.enabled ? this.createDiscountBar() : ''}
        </div>
        <div class="cart-drawer-footer">
          <div class="cart-total"></div>
          <button class="checkout-button">Checkout</button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.drawer = drawer;
    
    // Bind drawer events
    drawer.querySelector('.cart-drawer-close').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.cart-drawer-overlay').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.checkout-button').addEventListener('click', () => this.goToCheckout());
  }

  createFreeShippingBar() {
    const threshold = this.settings.freeShipping.threshold || 50;
    return `
      <div class="free-shipping-bar">
        <div class="shipping-progress">
          <div class="shipping-progress-bar"></div>
        </div>
        <div class="shipping-text">Add $${threshold} for free shipping!</div>
      </div>
    `;
  }

  createUpsellsSection() {
    return `
      <div class="upsells-section">
        <h3>Frequently Bought Together</h3>
        <div class="upsells-grid"></div>
      </div>
    `;
  }

  createAddOnsSection() {
    return `
      <div class="addons-section">
        <h3>Add Protection</h3>
        <div class="addons-list"></div>
      </div>
    `;
  }

  createDiscountBar() {
    return `
      <div class="discount-bar">
        <input type="text" class="discount-input" placeholder="Discount code">
        <button class="discount-apply">Apply</button>
      </div>
    `;
  }

  bindEvents() {
    // Intercept all add to cart form submissions
    document.addEventListener('submit', (e) => {
      const target = e.target;
      if (target && target.matches && target.matches('form[action*="/cart/add"], form.cart, form[action*="/cart/add.js"]')) {
        e.preventDefault();
        this.handleAddToCart(target);
      }
    }, true);

    // Intercept clicks on common ATC buttons
    document.addEventListener('click', (e) => {
      const el = e.target;
      if (!el || !(el instanceof Element)) return;
      const button = el.closest('button, a, input[type="submit"]');
      if (!button) return;
      if (
        button.matches('.btn-add-to-cart, [data-add-to-cart], .product-form__cart-submit, [name="add"], #AddToCart, button[type="submit"], .add-to-cart')
      ) {
        const form = button.closest('form[action*="/cart/add"], form.cart, form[action*="/cart/add.js"]');
        if (form) {
          e.preventDefault();
          this.handleAddToCart(form);
        }
      }
    }, true);

    // Listen for Shopify cart changes
    document.addEventListener('shopify:section:load', () => {
      this.loadCartData();
    });
  }

  async handleAddToCart(form) {
    try {
      // Submit the form data to Shopify
      const formData = new FormData(form);
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload cart data and open drawer
        await this.loadCartData();
        this.openDrawer();
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      // Fallback to normal form submission
      form.submit();
    }
  }

  updateUI() {
    if (!this.cartData) return;

    // Update sticky button count
    if (this.stickyButton) {
      const countEl = this.stickyButton.querySelector('.cart-count');
      countEl.textContent = this.cartData.item_count;
      countEl.style.display = this.cartData.item_count > 0 ? 'block' : 'none';
    }

    // Update drawer content
    if (this.drawer) {
      this.updateCartItems();
      this.updateCartTotal();
      this.updateFreeShippingProgress();
    }
  }

  updateCartItems() {
    const itemsContainer = this.drawer.querySelector('.cart-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = this.cartData.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="item-image">
          <img src="${item.featured_image?.url}" alt="${item.title}">
        </div>
        <div class="item-details">
          <h4>${item.title}</h4>
          <div class="item-variant">${item.variant_title || ''}</div>
          <div class="item-price">$${(item.price / 100).toFixed(2)}</div>
        </div>
        <div class="item-quantity">
          <button class="qty-decrease" data-key="${item.key}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-increase" data-key="${item.key}">+</button>
        </div>
        <button class="item-remove" data-key="${item.key}">×</button>
      </div>
    `).join('');

    // Bind quantity change events
    itemsContainer.querySelectorAll('.qty-decrease, .qty-increase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        const isIncrease = e.target.classList.contains('qty-increase');
        this.updateQuantity(key, isIncrease ? 1 : -1);
      });
    });

    itemsContainer.querySelectorAll('.item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        this.removeItem(key);
      });
    });
  }

  updateCartTotal() {
    const totalEl = this.drawer.querySelector('.cart-total');
    if (totalEl && this.cartData) {
      totalEl.innerHTML = `
        <div class="subtotal">Subtotal: $${(this.cartData.total_price / 100).toFixed(2)}</div>
      `;
    }
  }

  updateFreeShippingProgress() {
    if (!this.settings.freeShipping?.enabled) return;

    const progressBar = this.drawer.querySelector('.shipping-progress-bar');
    const shippingText = this.drawer.querySelector('.shipping-text');
    
    if (!progressBar || !shippingText) return;

    const threshold = this.settings.freeShipping.threshold * 100; // Convert to cents
    const currentTotal = this.cartData.total_price;
    const progress = Math.min((currentTotal / threshold) * 100, 100);
    const remaining = Math.max((threshold - currentTotal) / 100, 0);

    progressBar.style.width = `${progress}%`;
    
    if (remaining > 0) {
      shippingText.textContent = `Add $${remaining.toFixed(2)} for free shipping!`;
    } else {
      shippingText.textContent = '🎉 You qualify for free shipping!';
    }
  }

  async updateQuantity(key, change) {
    const item = this.cartData.items.find(item => item.key === key);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);
    
    try {
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { [key]: newQuantity }
        })
      });
      
      if (response.ok) {
        await this.loadCartData();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  }

  async removeItem(key) {
    await this.updateQuantity(key, -999); // Set to 0 by using large negative number
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  openDrawer() {
    this.drawer.classList.add('open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    this.drawer.classList.remove('open');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  goToCheckout() {
    window.location.href = '/checkout';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new StickyCartDrawer();
});