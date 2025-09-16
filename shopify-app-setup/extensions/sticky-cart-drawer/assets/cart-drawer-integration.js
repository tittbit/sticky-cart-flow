/**
 * Cart Drawer Integration Script
 * This script integrates the cart drawer with Shopify's native cart functionality
 */

class ShopifyCartIntegration {
  constructor() {
    this.shopDomain = window.Shopify?.shop || window.location.hostname;
    this.settings = null;
    this.init();
  }

  async init() {
    // Load settings from Supabase
    await this.loadSettings();
    
    if (!this.settings?.cartDrawerEnabled) return;

    // Override default add to cart behavior
    this.interceptAddToCart();
    
    // Create and inject cart drawer
    this.createCartDrawer();
    
    // Listen for cart updates
    this.bindCartEvents();
  }

  async loadSettings() {
    try {
      const response = await fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/shop-config`, {
        headers: {
          'Content-Type': 'application/json',
          'x-shop-domain': this.shopDomain
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.settings = data.settings;
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Failed to load cart drawer settings:', error);
      // Use default settings
      this.settings = {
        cartDrawerEnabled: true,
        stickyButtonEnabled: true,
        freeShippingEnabled: true,
        freeShippingThreshold: 50
      };
    }
  }

  interceptAddToCart() {
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
        // Track analytics
        this.trackAddToCart();
        
        // Open cart drawer instead of redirecting
        this.openCartDrawer();
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
      // Fallback to normal form submission
      form.submit();
    }
  }

  createCartDrawer() {
    // Implementation would create the actual cart drawer UI
    // This integrates with the React components we've built
    console.log('Cart drawer integration active with settings:', this.settings);
  }

  openCartDrawer() {
    // Trigger cart drawer open
    document.dispatchEvent(new CustomEvent('cart:drawer:open'));
  }

  trackAddToCart() {
    // Send analytics event to Supabase
    fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg',
        'x-shop-domain': this.shopDomain
      },
      body: JSON.stringify({
        eventType: 'cart_add',
        sessionId: this.getSessionId(),
        eventData: { source: 'add_to_cart_button' }
      })
    }).catch(console.error);
  }

  getSessionId() {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }

  bindCartEvents() {
    // Listen for Shopify cart updates
    document.addEventListener('cart:updated', () => {
      this.trackCartUpdate();
    });
  }

  trackCartUpdate() {
    fetch(`https://mjfzxmpscndznuaeoxft.supabase.co/functions/v1/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZnp4bXBzY25kem51YWVveGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDY2NzQsImV4cCI6MjA3MzI4MjY3NH0.xB_mlFv8uai35Vpil4yVsu1QqXyaa4IY9rHiYzbftAg',
        'x-shop-domain': this.shopDomain
      },
      body: JSON.stringify({
        eventType: 'cart_update',
        sessionId: this.getSessionId()
      })
    }).catch(console.error);
  }
}

// Initialize when DOM is ready  
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ShopifyCartIntegration());
} else {
  new ShopifyCartIntegration();
}