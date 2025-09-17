// Early cart interception - Place this before other imports
(function() {
  let cartInterceptionActive = false;
  
  const preventNativeCart = (e: Event) => {
    if (!cartInterceptionActive) return;
    
    const target = (e.target as Element)?.closest('[data-cart-drawer], [data-drawer-id="cart"], .js-sidebar-cart, .drawer--cart, .cart-popup, [aria-controls*="Cart"], .cart-icon, [href*="/cart"], [href="/cart"]');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      // Signal to our drawer to open instead
      setTimeout(() => {
        if ((window as any).stickyCartDrawer) {
          (window as any).stickyCartDrawer.openDrawer();
        }
      }, 50);
      return false;
    }
  };

  // Enable cart interception immediately
  const enableCartInterception = () => {
    cartInterceptionActive = true;
    document.addEventListener('click', preventNativeCart, true);
    document.addEventListener('touchstart', preventNativeCart, true);
  };

  // Enable after a brief delay to allow page to load
  setTimeout(enableCartInterception, 500);

  // Export for use by main drawer
  (window as any).cartInterception = { enableCartInterception, preventNativeCart };
})();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
