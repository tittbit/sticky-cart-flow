import React, { createContext, useContext, useEffect, useState } from 'react';
import { Provider } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge/utilities';

interface ShopifyContextType {
  isAuthenticated: boolean;
  shop: string | null;
  fetch: typeof authenticatedFetch | null;
  loading: boolean;
  error: string | null;
}

const ShopifyContext = createContext<ShopifyContextType>({
  isAuthenticated: false,
  shop: null,
  fetch: null,
  loading: true,
  error: null,
});

export const useShopify = () => {
  const context = useContext(ShopifyContext);
  if (!context) {
    throw new Error('useShopify must be used within a ShopifyProvider');
  }
  return context;
};

interface ShopifyProviderProps {
  children: React.ReactNode;
}

export const ShopifyProvider: React.FC<ShopifyProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shop, setShop] = useState<string | null>(null);
  const [fetch, setFetch] = useState<typeof authenticatedFetch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeShopify = async () => {
      try {
        // Get shop from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        const storedShop = localStorage.getItem('shopify_shop');
        
        const currentShop = shopParam || storedShop;
        
        if (currentShop) {
          setShop(currentShop);
          localStorage.setItem('shopify_shop', currentShop);
          setIsAuthenticated(true);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Shopify');
        setLoading(false);
      }
    };

    initializeShopify();
  }, []);

  const value = {
    isAuthenticated,
    shop,
    fetch,
    loading,
    error,
  };

  if (loading) {
    return <div className="loading-spinner">Initializing...</div>;
  }

  // For embedded app
  if (shop && isAuthenticated) {
    return (
      <Provider
        config={{
          apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || 'demo',
          host: new URLSearchParams(window.location.search).get('host') || '',
          forceRedirect: false,
        }}
      >
        <ShopifyContext.Provider value={value}>
          {children}
        </ShopifyContext.Provider>
      </Provider>
    );
  }

  // For standalone app
  return (
    <ShopifyContext.Provider value={value}>
      {children}
    </ShopifyContext.Provider>
  );
};