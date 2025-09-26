import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from './ShopifyContext';
import { toast } from 'sonner';

// Centralized settings interface
export interface AppSettings {
  // Cart Drawer Settings
  cartDrawer: {
    enabled: boolean;
    position: 'right' | 'left';
    theme: 'light' | 'dark' | 'auto';
    autoOpen: boolean;
    showOnDesktop: boolean;
    showOnMobile: boolean;
    animation: 'slide' | 'fade' | 'scale';
    backdropBlur: boolean;
  };

  // Sticky Button Settings
  stickyButton: {
    enabled: boolean;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    text: string;
    showCount: boolean;
    showPrice: boolean;
    icon: 'cart' | 'bag' | 'basket';
    size: 'sm' | 'md' | 'lg';
    color: string;
    animation: 'bounce' | 'pulse' | 'shake' | 'none';
  };

  // Free Shipping Settings
  freeShipping: {
    enabled: boolean;
    threshold: number;
    message: string;
    progressBar: boolean;
    currency: string;
  };

  // Promotions
  promotions: {
    enabled: boolean;
    announcements: Array<{
      id: string;
      text: string;
      type: 'info' | 'success' | 'warning' | 'error';
      enabled: boolean;
    }>;
  };

  // Analytics
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    enableTracking: boolean;
  };

  // Design & Colors
  design: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    borderRadius: number;
    fontFamily: string;
  };
}

// Default settings
const defaultSettings: AppSettings = {
  cartDrawer: {
    enabled: true,
    position: 'right',
    theme: 'auto',
    autoOpen: false,
    showOnDesktop: true,
    showOnMobile: true,
    animation: 'slide',
    backdropBlur: true,
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
    animation: 'bounce',
  },
  freeShipping: {
    enabled: true,
    threshold: 75,
    message: 'Free shipping on orders over $75!',
    progressBar: true,
    currency: 'USD',
  },
  promotions: {
    enabled: true,
    announcements: [],
  },
  analytics: {
    enableTracking: false,
  },
  design: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    textColor: '#212529',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    fontFamily: 'Inter',
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  saveSettings: () => Promise<void>;
  loading: boolean;
  hasUnsavedChanges: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { shop } = useShopify();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from database
  useEffect(() => {
    if (shop) {
      loadSettings();
    }
  }, [shop]);

  const loadSettings = async () => {
    if (!shop) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_configurations')
        .select('settings')
        .eq('shop_domain', shop)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.settings) {
        // Merge with defaults to ensure all properties exist
        const mergedSettings = {
          ...defaultSettings,
          ...data.settings,
          cartDrawer: { ...defaultSettings.cartDrawer, ...data.settings.cartDrawer },
          stickyButton: { ...defaultSettings.stickyButton, ...data.settings.stickyButton },
          freeShipping: { ...defaultSettings.freeShipping, ...data.settings.freeShipping },
          promotions: { ...defaultSettings.promotions, ...data.settings.promotions },
          analytics: { ...defaultSettings.analytics, ...data.settings.analytics },
          design: { ...defaultSettings.design, ...data.settings.design },
        };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings };
    
    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key as keyof AppSettings] === 'object' && !Array.isArray(updates[key as keyof AppSettings])) {
        newSettings[key as keyof AppSettings] = {
          ...newSettings[key as keyof AppSettings],
          ...updates[key as keyof AppSettings]
        } as any;
      } else {
        (newSettings as any)[key] = updates[key as keyof AppSettings];
      }
    });

    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    if (!shop || !hasUnsavedChanges) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          shop_domain: shop,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setHasUnsavedChanges(false);
      
      // Trigger frontend update via shop-config endpoint
      await fetch('/api/shop-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop, settings })
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    settings,
    updateSettings,
    saveSettings,
    loading,
    hasUnsavedChanges,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};