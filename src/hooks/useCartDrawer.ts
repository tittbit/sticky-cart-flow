import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CartSettings {
  cartDrawerEnabled: boolean;
  drawerPosition: 'left' | 'right';
  themeColor: string;
  stickyButtonEnabled: boolean;
  stickyButtonText: string;
  stickyButtonPosition: string;
  upsellsEnabled: boolean;
  addOnsEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  discountBarEnabled: boolean;
  discountCode: string;
  announcementText: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  currency?: string;
}

export interface UpsellProduct {
  id: string;
  product_id: string;
  product_handle: string;
  product_title: string;
  product_price: string;
  product_image_url?: string;
  target_products?: string[];
  is_active: boolean;
  display_order: number;
}

export interface AddOnProduct {
  id: string;
  product_id: string;
  product_handle: string;
  product_title: string;
  product_price: string;
  product_image_url?: string;
  description?: string;
  default_selected: boolean;
  is_active: boolean;
  display_order: number;
}

export const useCartDrawer = (shopDomain?: string) => {
  const [settings, setSettings] = useState<CartSettings | null>(null);
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [addOnProducts, setAddOnProducts] = useState<AddOnProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getShopDomain = (): string => {
    if (shopDomain) return shopDomain;
    
    // Get from URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qp = params.get('shop');
      if (qp?.trim()) return qp.trim();
    }

    // Get from localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('shop_domain') : null;
    if (saved?.trim()) return saved.trim();

    // Get from Shopify context
    const shopifyShop = typeof window !== 'undefined' ? (window as any)?.Shopify?.shop : undefined;
    if (shopifyShop && typeof shopifyShop === 'string') return shopifyShop;

    // Fallback
    return 'demo-shop.myshopify.com';
  };

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const shop = getShopDomain();

      // Load settings from shop-config
      const { data: configData, error: configError } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 
          'x-shop-domain': shop,
          'Content-Type': 'application/json'
        }
      });

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

      if (configData?.success && configData.settings) {
        setSettings(configData.settings);
      }

      // Load upsells if enabled
      if (configData?.settings?.upsellsEnabled) {
        const { data: upsellData, error: upsellError } = await supabase.functions.invoke('upsells', {
          method: 'GET',
          headers: { 
            'x-shop-domain': shop,
            'Content-Type': 'application/json'
          }
        });

        if (upsellError) {
          console.error('Upsell error:', upsellError);
        } else if (upsellData?.success) {
          setUpsellProducts(upsellData.products || []);
        }
      }

      // Load add-ons if enabled
      if (configData?.settings?.addOnsEnabled) {
        const { data: addonData, error: addonError } = await supabase.functions.invoke('addons', {
          method: 'GET',
          headers: { 
            'x-shop-domain': shop,
            'Content-Type': 'application/json'
          }
        });

        if (addonError) {
          console.error('Addon error:', addonError);
        } else if (addonData?.success) {
          setAddOnProducts(addonData.products || []);
        }
      }

    } catch (err) {
      console.error('Error loading cart configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const sendAnalytics = async (eventType: string, eventData: any) => {
    try {
      const shop = getShopDomain();
      await supabase.functions.invoke('analytics', {
        method: 'POST',
        headers: { 
          'x-shop-domain': shop,
          'Content-Type': 'application/json'
        },
        body: {
          eventType,
          sessionId: `session-${Date.now()}`,
          eventData
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  useEffect(() => {
    loadConfiguration();

    // Listen for settings updates
    const handleConfigUpdate = () => {
      loadConfiguration();
    };

    window.addEventListener('shop-config:updated', handleConfigUpdate);
    return () => window.removeEventListener('shop-config:updated', handleConfigUpdate);
  }, [shopDomain]);

  return {
    settings,
    upsellProducts,
    addOnProducts,
    loading,
    error,
    reload: loadConfiguration,
    sendAnalytics
  };
};