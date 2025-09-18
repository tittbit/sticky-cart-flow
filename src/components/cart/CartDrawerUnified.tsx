import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCartDrawer } from "@/hooks/useCartDrawer";

interface CartItem {
  id: number;
  title: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
  product_id?: string;
  variant_id?: string;
}

interface CartDrawerUnifiedProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  shopDomain?: string;
  isPreview?: boolean;
  onItemUpdate?: (itemId: number, quantity: number) => void;
  onItemRemove?: (itemId: number) => void;
  onCheckout?: () => void;
}

export const CartDrawerUnified = ({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  shopDomain,
  isPreview = false,
  onItemUpdate,
  onItemRemove,
  onCheckout
}: CartDrawerUnifiedProps) => {
  const { settings, upsellProducts, addOnProducts, loading, sendAnalytics } = useCartDrawer(shopDomain);
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  // Initialize quantities from items
  useEffect(() => {
    const initialQuantities: { [key: number]: number } = {};
    items.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [items]);

  // Initialize default selected add-ons
  useEffect(() => {
    const defaultSelected = new Set(
      addOnProducts
        .filter(addon => addon.default_selected)
        .map(addon => addon.product_id)
    );
    setSelectedAddOns(defaultSelected);
  }, [addOnProducts]);

  // Send analytics when drawer opens
  useEffect(() => {
    if (isOpen && !isPreview) {
      sendAnalytics('cart_drawer_opened', {
        itemCount: items.length,
        cartTotal: total,
        timestamp: Date.now()
      });
    }
  }, [isOpen, isPreview, items.length, total, sendAnalytics]);

  if (!isOpen || !settings) return null;

  const currency = settings?.currency || 'USD';
  const position = settings.drawerPosition || 'right';
  const themeColor = settings.themeColor || '#000000';

  // Calculate enhanced total including selected upsells and add-ons
  const calculateEnhancedTotal = () => {
    let enhancedTotal = total;
    
    // Add selected upsells
    selectedUpsells.forEach(productId => {
      const upsell = upsellProducts.find(u => u.product_id === productId);
      if (upsell) {
        enhancedTotal += parseFloat(upsell.product_price) || 0;
      }
    });
    
    // Add selected add-ons
    selectedAddOns.forEach(productId => {
      const addon = addOnProducts.find(a => a.product_id === productId);
      if (addon) {
        enhancedTotal += parseFloat(addon.product_price) || 0;
      }
    });
    
    return enhancedTotal;
  };

  const enhancedTotal = calculateEnhancedTotal();

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
      onItemUpdate?.(itemId, newQuantity);
    }
  };

  const removeItem = (itemId: number) => {
    onItemRemove?.(itemId);
  };

  const handleCheckout = () => {
    if (!isPreview) {
      sendAnalytics('cart_checkout_initiated', {
        itemCount: items.length,
        cartTotal: enhancedTotal,
        selectedUpsells: Array.from(selectedUpsells),
        selectedAddOns: Array.from(selectedAddOns),
        timestamp: Date.now()
      });
    }
    onCheckout?.();
  };

  const handleUpsellToggle = (productId: string, checked: boolean) => {
    setSelectedUpsells(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
        if (!isPreview) {
          sendAnalytics('upsell_added', { productId, timestamp: Date.now() });
        }
      } else {
        newSet.delete(productId);
        if (!isPreview) {
          sendAnalytics('upsell_removed', { productId, timestamp: Date.now() });
        }
      }
      return newSet;
    });
  };

  const handleAddOnToggle = (productId: string, checked: boolean) => {
    setSelectedAddOns(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
        if (!isPreview) {
          sendAnalytics('addon_added', { productId, timestamp: Date.now() });
        }
      } else {
        newSet.delete(productId);
        if (!isPreview) {
          sendAnalytics('addon_removed', { productId, timestamp: Date.now() });
        }
      }
      return newSet;
    });
  };

  // Free shipping calculation
  const freeShippingThreshold = settings.freeShippingThreshold || 0;
  const shippingProgress = Math.min((enhancedTotal / freeShippingThreshold) * 100, 100);
  const amountForFreeShipping = Math.max(freeShippingThreshold - enhancedTotal, 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed ${position === 'left' ? 'left-0' : 'right-0'} top-0 h-full w-full max-w-md bg-background shadow-custom-xl z-50 relative flex flex-col animate-enter`}
        style={{ 
          '--theme-color': themeColor,
          borderLeft: position === 'right' ? `2px solid ${themeColor}20` : 'none',
          borderRight: position === 'left' ? `2px solid ${themeColor}20` : 'none'
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🛒 Shopping Cart ({items.length})
            {isPreview && <Badge variant="secondary" className="text-xs">Preview</Badge>}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10">
            ✕
          </Button>
        </div>
 
        <div className="p-4 space-y-6 pb-40 flex-1 overflow-y-auto">
          {/* Free Shipping Progress */}
          {settings.freeShippingEnabled && freeShippingThreshold > 0 && (
            <Card className="card-gradient border border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">🚚 Free Shipping Progress</span>
                    <span className="text-primary font-semibold">
                      {shippingProgress >= 100 ? 'Eligible!' : `${currency} ${amountForFreeShipping.toFixed(2)} to go`}
                    </span>
                  </div>
                  <Progress value={shippingProgress} className="h-2" />
                  {shippingProgress >= 100 ? (
                    <p className="text-sm text-success font-medium">🎉 You've qualified for free shipping!</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add {currency} {amountForFreeShipping.toFixed(2)} more to qualify for free shipping
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cart Items */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <span>📦</span> Cart Items
            </h3>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Your cart is empty</p>
                <Button variant="outline" onClick={onClose} className="mt-2">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="product-card hover-lift">
                  <CardContent className="p-3">
                    <div className="flex space-x-3">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-primary/10"
                              onClick={() => updateQuantity(item.id, (quantities[item.id] || item.quantity) - 1)}
                            >
                              -
                            </Button>
                            <span className="text-sm w-8 text-center font-medium">
                              {quantities[item.id] || item.quantity}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-primary/10"
                              onClick={() => updateQuantity(item.id, (quantities[item.id] || item.quantity) + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">
                              {currency} {(item.price * (quantities[item.id] || item.quantity)).toFixed(2)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(item.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Upsells */}
          {settings.upsellsEnabled && upsellProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <span>💰</span> Frequently Bought Together
              </h3>
              <div className="space-y-3">
                {upsellProducts.slice(0, 3).map((upsell) => (
                  <Card key={upsell.product_id} className="product-card hover-lift">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedUpsells.has(upsell.product_id)}
                          onCheckedChange={(checked) => handleUpsellToggle(upsell.product_id, checked as boolean)}
                          className="border-primary"
                        />
                        {upsell.product_image_url && (
                          <img 
                            src={upsell.product_image_url} 
                            alt={upsell.product_title}
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{upsell.product_title}</h4>
                          <p className="font-semibold text-primary">
                            {currency} {parseFloat(upsell.product_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Add-Ons */}
          {settings.addOnsEnabled && addOnProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <span>➕</span> Protect Your Purchase
              </h3>
              <div className="space-y-3">
                {addOnProducts.map((addon) => (
                  <Card key={addon.product_id} className="product-card hover-lift">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedAddOns.has(addon.product_id)}
                          onCheckedChange={(checked) => handleAddOnToggle(addon.product_id, checked as boolean)}
                          className="border-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{addon.product_title}</h4>
                            <span className="font-semibold text-primary">
                              {currency} {parseFloat(addon.product_price).toFixed(2)}
                            </span>
                          </div>
                          {addon.description && (
                            <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Discount Code */}
          {settings.discountBarEnabled && (
            <Card className="card-gradient border border-accent/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm flex items-center gap-2">
                      <span>🎫</span> Have a discount code?
                    </span>
                    {settings.discountCode && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {settings.discountCode}
                      </Badge>
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
          {settings.announcementText && (
            <div 
              className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3 text-center"
              style={{ borderColor: `${themeColor}30` }}
            >
              <p className="text-sm font-medium" style={{ color: themeColor }}>
                📢 {settings.announcementText}
              </p>
            </div>
          )}
        </div>

        {/* Footer inside drawer */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 space-y-4">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-primary" style={{ color: themeColor }}>
              {currency} {enhancedTotal.toFixed(2)}
            </span>
          </div>
          
          <div className="space-y-2">
            <Button 
              className="w-full text-white font-semibold"
              style={{ backgroundColor: themeColor }}
              onClick={handleCheckout}
            >
              {isPreview ? '🔍 Preview Checkout' : '🛒 Proceed to Checkout'}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};