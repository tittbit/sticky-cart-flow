import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: number;
  title: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

interface SharedCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  position?: "left" | "right";
  themeColor?: string;
  currency?: string;
  shopDomain?: string;
}

// Shared cart drawer styles and logic for both preview and live environments
export const useCartDrawerLogic = (shopDomain?: string) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);
  const [addOnProducts, setAddOnProducts] = useState<any[]>([]);

  useEffect(() => {
    loadConfiguration();
    loadUpsells();
    loadAddOns();
  }, [shopDomain]);

  const loadConfiguration = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shop = shopDomain || getShopDomain();
      const { data, error } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (error) throw error;
      
      if (data?.success) {
        setSettings(data.settings);
      } else {
        setSettings({
          cartDrawerEnabled: true,
          freeShippingEnabled: true,
          freeShippingThreshold: 50,
          upsellsEnabled: false,
          addOnsEnabled: false
        });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setSettings({
        cartDrawerEnabled: true,
        freeShippingEnabled: true,
        freeShippingThreshold: 50
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUpsells = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shop = shopDomain || getShopDomain();
      const { data } = await supabase.functions.invoke('upsells', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success) {
        setUpsellProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load upsells:', error);
    }
  };

  const loadAddOns = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shop = shopDomain || getShopDomain();
      const { data } = await supabase.functions.invoke('addons', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success) {
        setAddOnProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load add-ons:', error);
    }
  };

  return {
    settings,
    loading,
    upsellProducts,
    addOnProducts
  };
};

// Free shipping bar component
export const FreeShippingBar = ({ 
  settings, 
  total, 
  currency 
}: { 
  settings: any; 
  total: number; 
  currency: string;
}) => {
  if (!settings?.freeShippingEnabled) return null;

  const freeShippingThreshold = settings?.freeShippingThreshold || 75;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const freeShippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);

  return (
    <Card className="card-gradient">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Free shipping progress</span>
            {remainingForFreeShipping > 0 ? (
              <span className="text-muted-foreground">
                {currency} {remainingForFreeShipping.toFixed(2)} remaining
              </span>
            ) : (
              <Badge className="bg-success text-success-foreground">
                Free shipping unlocked! 🎉
              </Badge>
            )}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {remainingForFreeShipping > 0 
              ? `Add ${currency} ${remainingForFreeShipping.toFixed(2)} more for free shipping!`
              : "You've qualified for free shipping!"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Upsells section component
export const UpsellsSection = ({ 
  settings, 
  upsellProducts, 
  currency,
  items,
  selectedUpsells,
  onUpsellToggle
}: { 
  settings: any; 
  upsellProducts: any[]; 
  currency: string;
  items: CartItem[];
  selectedUpsells?: Set<string>;
  onUpsellToggle?: (productId: string, selected: boolean) => void;
}) => {
  if (!settings?.upsellsEnabled || !upsellProducts.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Frequently bought together</h3>
      <div className="grid grid-cols-2 gap-3">
        {upsellProducts.slice(0, 4).map((product) => {
          // Check if product is already in cart
          const isInCart = items.some(item => 
            item.id.toString() === product.product_id?.toString()
          );
          const isSelected = selectedUpsells?.has(product.product_id) || false;
          
          return (
            <div key={product.id} className="product-card">
              <img 
                src={product.product_image_url || "https://images.unsplash.com/photo-1563013544-824ae1b704b3?w=60&h=60&fit=crop"}
                alt={product.product_title}
                className="w-full h-20 rounded-lg object-cover mb-2"
              />
              <h4 className="font-medium text-xs mb-1">{product.product_title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{currency} {product.product_price}</span>
                <Button 
                  size="sm" 
                  className={`h-6 text-xs px-2 ${isInCart ? 'bg-gray-400' : isSelected ? 'bg-success' : ''}`}
                  disabled={isInCart}
                  onClick={() => onUpsellToggle?.(product.product_id, !isSelected)}
                >
                  {isInCart ? 'Added' : isSelected ? '✓' : 'Add'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Add-ons section component
export const AddOnsSection = ({ 
  settings, 
  addOnProducts, 
  currency,
  selectedAddOns,
  onAddOnToggle
}: { 
  settings: any; 
  addOnProducts: any[]; 
  currency: string;
  selectedAddOns?: Set<string>;
  onAddOnToggle?: (productId: string, selected: boolean) => void;
}) => {
  if (!settings?.addOnsEnabled || !addOnProducts.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Protect your purchase</h3>
      {addOnProducts.map((addon) => {
        const isSelected = selectedAddOns?.has(addon.product_id) || addon.default_selected;
        return (
          <label key={addon.id} className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-primary"
              checked={isSelected}
              onChange={(e) => onAddOnToggle?.(addon.product_id, e.target.checked)}
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{addon.product_title}</div>
              <div className="text-xs text-muted-foreground">+{currency} {addon.product_price}</div>
              {addon.description && (
                <div className="text-xs text-muted-foreground mt-1">{addon.description}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};