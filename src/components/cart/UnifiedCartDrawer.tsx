import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";

interface CartItem {
  id: number;
  title: string;
  variant?: string;
  price: number;
  quantity: number;
  image: string;
}

interface UnifiedCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  position?: "left" | "right";
  themeColor?: string;
  currency?: string;
  shopDomain?: string;
}

export const UnifiedCartDrawer = ({
  isOpen,
  onClose,
  items,
  total,
  position = "right",
  themeColor = "#3B82F6",
  currency = "USD",
  shopDomain
}: UnifiedCartDrawerProps) => {
  const [settings, setSettings] = useState<any>(null);
  const [upsells, setUpsells] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  useEffect(() => {
    loadLocalSettings();
  }, [position, themeColor, currency]);

  const loadLocalSettings = () => {
    // Check if settings are already loaded in window
    if (window.STICKY_CART_SETTINGS) {
      setSettings(window.STICKY_CART_SETTINGS);
      setUpsells(window.STICKY_CART_UPSELLS || []);
      setAddons(window.STICKY_CART_ADDONS || []);
      return;
    }

    // If not loaded, try to load the settings file
    const script = document.createElement('script');
    script.src = `/tools/cart-drawer/settings?shop=${shopDomain}&t=${Date.now()}`;
    script.onload = () => {
      setSettings(window.STICKY_CART_SETTINGS);
      setUpsells(window.STICKY_CART_UPSELLS || []);
      setAddons(window.STICKY_CART_ADDONS || []);
    };
    script.onerror = () => {
      // Fallback to default settings
      setSettings({
        enabled: true,
        cartDrawerEnabled: true,
        drawerPosition: 'right',
        themeColor: '#3B82F6',
        stickyButton: { enabled: true, text: 'Cart', position: 'bottom-right' },
        freeShipping: { enabled: false, threshold: 50 },
        upsells: { enabled: false },
        addOns: { enabled: false },
        discountBar: { enabled: false, code: '' },
        currency: 'USD'
      });
    };
    document.head.appendChild(script);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const actualPosition = settings?.drawerPosition || position;
  const actualThemeColor = settings?.themeColor || themeColor;
  const actualCurrency = settings?.currency || currency;

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: actualCurrency,
      }).format(amount);
    } catch {
      return `${actualCurrency} ${amount.toFixed(2)}`;
    }
  };

  const calculateShippingProgress = () => {
    if (!settings?.freeShipping?.enabled) return 0;
    const threshold = settings.freeShipping.threshold;
    return Math.min((total / threshold) * 100, 100);
  };

  const shippingRemaining = () => {
    if (!settings?.freeShipping?.enabled) return 0;
    return Math.max(settings.freeShipping.threshold - total, 0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 ${actualPosition === 'left' ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col transform transition-transform`}
        style={{ maxWidth: '90vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" style={{ color: actualThemeColor }} />
            <h2 className="text-lg font-semibold">Your Cart</h2>
            {itemCount > 0 && (
              <Badge variant="secondary">{itemCount} item{itemCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">Add some items to get started!</p>
            </div>
          )}

          {/* Cart Items */}
          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground">{item.variant}</p>
                    )}
                    <p className="text-sm font-medium">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Free Shipping Bar */}
          {settings?.freeShipping?.enabled && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Free shipping progress</span>
                    <span>{Math.round(calculateShippingProgress())}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${calculateShippingProgress()}%`,
                        backgroundColor: actualThemeColor 
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shippingRemaining() > 0 
                      ? `Add ${formatCurrency(shippingRemaining())} more for free shipping!`
                      : '🎉 You qualify for free shipping!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upsells */}
          {settings?.upsells?.enabled && upsells.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Frequently Bought Together</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upsells.slice(0, 3).map((upsell) => (
                  <div key={upsell.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    {upsell.product_image_url && (
                      <img 
                        src={upsell.product_image_url} 
                        alt={upsell.product_title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{upsell.product_title}</h5>
                      <p className="text-sm font-medium">{formatCurrency(upsell.product_price)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      style={{ backgroundColor: actualThemeColor, color: 'white' }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add-ons */}
          {settings?.addOns?.enabled && addons.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Protect Your Purchase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addons.slice(0, 2).map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{addon.product_title}</h5>
                      {addon.description && (
                        <p className="text-xs text-muted-foreground">{addon.description}</p>
                      )}
                      <p className="text-sm font-medium">{formatCurrency(addon.product_price)}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      style={{ borderColor: actualThemeColor, color: actualThemeColor }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Discount Bar */}
          {settings?.discountBar?.enabled && settings.discountBar.code && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">💰 Special Offer</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use code <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{settings.discountBar.code}</code> for a discount!
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{ borderColor: actualThemeColor, color: actualThemeColor }}
                  >
                    Apply Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
            
            <Button 
              className="w-full h-12 text-base font-semibold text-white"
              style={{ backgroundColor: actualThemeColor }}
              onClick={() => {
                window.location.href = '/checkout';
              }}
            >
              Proceed to Checkout
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onClose}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// Declare global window types
declare global {
  interface Window {
    STICKY_CART_SETTINGS?: any;
    STICKY_CART_UPSELLS?: any[];
    STICKY_CART_ADDONS?: any[];
    STICKY_CART_SETTINGS_LOADED?: number;
  }
}