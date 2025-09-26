/**
 * Sticky Cart Drawer App Embed
 * This script handles the app embed functionality for Shopify themes
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    cartDrawerScript: '/cart-drawer.js',
    settingsEndpoint: '/api/shop-config',
    debug: false
  };

  // Utility functions
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[Sticky Cart Drawer]', ...args);
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize the app embed
  async function initializeAppEmbed() {
    try {
      log('Initializing app embed...');

      // Get shop domain
      const shopDomain = window.Shopify?.shop || 'demo.myshopify.com';
      
      // Fetch app settings
      const settingsResponse = await fetch(`${CONFIG.settingsEndpoint}?shop=${shopDomain}`);
      const settings = await settingsResponse.json();

      if (!settings.enabled) {
        log('App is disabled for this shop');
        return;
      }

      // Load the cart drawer script
      await loadScript(CONFIG.cartDrawerScript);

      // Initialize the cart drawer with settings
      if (window.StickyCartDrawer) {
        window.StickyCartDrawer.init(settings);
        log('Cart drawer initialized successfully');
      }

    } catch (error) {
      console.error('[Sticky Cart Drawer] Failed to initialize:', error);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppEmbed);
  } else {
    initializeAppEmbed();
  }

})();