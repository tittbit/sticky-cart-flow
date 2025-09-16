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

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  position?: "left" | "right";
  themeColor?: string;
  currency?: string;
  shopDomain?: string;
}

export const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  position = "right",
  themeColor = "#000000",
  currency = "USD",
  shopDomain 
}: CartDrawerProps) => {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);

  // Load configuration from Supabase
  useEffect(() => {
    loadConfiguration();
    loadUpsells();
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
        setUpsellProducts(data.upsellProducts || []);
      } else {
        // Default settings
        setSettings({
          cartDrawerEnabled: true,
          stickyButtonEnabled: true,
          drawerPosition: 'right',
          themeColor: '#000000',
          freeShippingEnabled: true,
          freeShippingThreshold: 50,
          upsellsEnabled: false,
          addOnsEnabled: false,
          discountBarEnabled: false
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

  // Currency: prefer storefront currency if available
  const storefrontCurrency = (typeof window !== 'undefined') ? (window as any)?.Shopify?.currency?.active : undefined;
  const displayCurrency = storefrontCurrency || currency;

  const freeShippingThreshold = settings?.freeShippingThreshold || 75;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const freeShippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);
  const actualPosition = settings?.drawerPosition || position;
  const actualThemeColor = settings?.themeColor || themeColor;

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    }
  };

  const removeItem = (itemId: number) => {
    // In real implementation, this would call Shopify Cart API
    console.log("Remove item:", itemId);
  };

  const addOnProducts = [
    {
      id: 201,
      title: "2-Year Warranty Protection",
      price: 29.99,
      checked: false,
    },
    {
      id: 202,
      title: "Express Shipping",
      price: 9.99,
      checked: false,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed ${actualPosition === 'left' ? 'left-0' : 'right-0'} top-0 h-full w-full max-w-md bg-background shadow-custom-xl z-50 ${actualPosition === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'} overflow-y-auto`}
        style={{ 
          '--theme-color': actualThemeColor,
          borderLeft: actualPosition === 'right' ? `2px solid ${actualThemeColor}20` : 'none',
          borderRight: actualPosition === 'left' ? `2px solid ${actualThemeColor}20` : 'none'
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shopping Cart ({items.length})</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Free Shipping Progress */}
          {settings?.freeShippingEnabled && (
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Free shipping progress</span>
                  {remainingForFreeShipping > 0 ? (
                  <span className="text-muted-foreground">
                    {displayCurrency} {remainingForFreeShipping.toFixed(2)} remaining
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
                    ? `Add ${displayCurrency} ${remainingForFreeShipping.toFixed(2)} more for free shipping!`
                    : "You've qualified for free shipping!"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Cart Items */}
          <div className="space-y-4">
            <h3 className="font-medium">Cart Items</h3>
            {items.map((item) => (
              <div key={item.id} className="product-card">
                <div className="flex space-x-3">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.variant}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="text-sm w-8 text-center">
                          {quantities[item.id] || item.quantity}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">
                          {displayCurrency} {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upsells */}
          {settings?.upsellsEnabled && upsellProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Frequently bought together</h3>
            <div className="grid grid-cols-2 gap-3">
              {upsellProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="product-card">
                  <img 
                    src={product.product_image_url || "https://images.unsplash.com/photo-1563013544-824ae1b704b3?w=60&h=60&fit=crop"}
                    alt={product.product_title}
                    className="w-full h-20 rounded-lg object-cover mb-2"
                  />
                  <h4 className="font-medium text-xs mb-1">{product.product_title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{displayCurrency} {product.product_price}</span>
                    <Button size="sm" className="h-6 text-xs px-2">
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Add-Ons */}
          {settings?.addOnsEnabled && (
          <div className="space-y-3">
            <h3 className="font-medium">Protect your purchase</h3>
            {addOnProducts.map((addon) => (
              <label key={addon.id} className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary"
                  defaultChecked={addon.checked}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{addon.title}</div>
                  <div className="text-xs text-muted-foreground">+{currency} {addon.price}</div>
                </div>
              </label>
            ))}
          </div>
          )}

          {/* Discount Code */}
          {settings?.discountBarEnabled && (
          <Card className="card-gradient">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Have a discount code?</span>
                  {settings?.discountCode && (
                    <Badge variant="secondary">{settings.discountCode}</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Apply Discount Code
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Announcement */}
          {settings?.announcementText && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-center">
            <p className="text-sm text-accent-foreground">
              {settings.announcementText}
            </p>
          </div>
          )}

          {/* Total and Checkout */}
          <div className="sticky bottom-0 bg-background pt-4 border-t space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{currency} {total.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full gradient-primary text-white">
                Proceed to Checkout
              </Button>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};