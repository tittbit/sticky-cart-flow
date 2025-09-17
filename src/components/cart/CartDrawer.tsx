import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  useCartDrawerLogic, 
  FreeShippingBar, 
  UpsellsSection, 
  AddOnsSection 
} from "./SharedCartDrawer";

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
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  
  // Use shared cart drawer logic
  const { settings, loading, upsellProducts, addOnProducts } = useCartDrawerLogic(shopDomain);

  // Initialize default selected add-ons
  useEffect(() => {
    const defaultSelected = new Set(
      addOnProducts
        .filter(addon => addon.default_selected)
        .map(addon => addon.product_id)
    );
    setSelectedAddOns(defaultSelected);
  }, [addOnProducts]);

  // Currency: prefer storefront currency if available
  const storefrontCurrency = (typeof window !== 'undefined') ? (window as any)?.Shopify?.currency?.active : undefined;
  const displayCurrency = storefrontCurrency || currency;
  const actualPosition = settings?.drawerPosition || position;
  const actualThemeColor = settings?.themeColor || themeColor;

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

  const handleUpsellToggle = (productId: string, selected: boolean) => {
    setSelectedUpsells(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleAddOnToggle = (productId: string, selected: boolean) => {
    setSelectedAddOns(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    }
  };

  const removeItem = (itemId: number) => {
    // In real implementation, this would call Shopify Cart API
    console.log("Remove item:", itemId);
  };



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
          <FreeShippingBar 
            settings={settings} 
            total={enhancedTotal} 
            currency={displayCurrency} 
          />

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
          <UpsellsSection 
            settings={settings}
            upsellProducts={upsellProducts}
            currency={displayCurrency}
            items={items}
            selectedUpsells={selectedUpsells}
            onUpsellToggle={handleUpsellToggle}
          />

          {/* Add-Ons */}
          <AddOnsSection 
            settings={settings}
            addOnProducts={addOnProducts}
            currency={displayCurrency}
            selectedAddOns={selectedAddOns}
            onAddOnToggle={handleAddOnToggle}
          />

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
              <span>{displayCurrency} {enhancedTotal.toFixed(2)}</span>
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