import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  freeShippingThreshold: number;
  freeShippingEnabled: boolean;
  upsellsEnabled: boolean;
  addOnsEnabled: boolean;
  discountBarEnabled: boolean;
  announcementText: string;
  discountCode: string;
  storefrontCurrency: string;
}

interface UpsellProduct {
  product_id: string;
  product_title: string;
  product_handle: string;
  product_price: string;
  product_image: string;
}

interface AddOnProduct {
  product_id: string;
  product_title: string;
  product_handle: string;
  product_price: string;
  product_image: string;
  default_selected: boolean;
}

interface CartDrawerLogic {
  settings: Settings | null;
  loading: boolean;
  upsellProducts: UpsellProduct[];
  addOnProducts: AddOnProduct[];
}

export const useCartDrawerLogic = (shopDomain: string | undefined): CartDrawerLogic => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [addOnProducts, setAddOnProducts] = useState<AddOnProduct[]>([]);

  useEffect(() => {
    if (!shopDomain) return;

    const loadSettings = async () => {
      try {
        console.log('Fetching settings for shop:', shopDomain);
        const { data } = await supabase.functions.invoke('shop-config', {
          method: 'GET',
          headers: { 'x-shop-domain': shopDomain }
        });

        console.log('Settings data:', data);

        if (data?.success) {
          setSettings(data.settings);
          setUpsellProducts(data.upsellProducts);
        } else {
          console.error('Failed to load settings:', data?.error);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadAddOns = async () => {
      try {
        console.log('Fetching add-ons for shop:', shopDomain);
        const { data } = await supabase.functions.invoke('addons', {
          method: 'GET',
          headers: { 'x-shop-domain': shopDomain }
        });

        console.log('Add-ons data:', data);

        if (data?.success) {
          setAddOnProducts(data.products);
        } else {
          console.error('Failed to load add-ons:', data?.error);
        }
      } catch (error) {
        console.error('Error loading add-ons:', error);
      }
    };

    loadSettings();
    loadAddOns();
  }, [shopDomain]);

  return { settings, loading, upsellProducts, addOnProducts };
};

interface FreeShippingBarProps {
  settings: Settings | null;
  total: number;
  currency: string;
}

export const FreeShippingBar = ({ settings, total, currency }: FreeShippingBarProps) => {
  if (!settings?.freeShippingEnabled) return null;

  const threshold = settings?.freeShippingThreshold || 50;
  const remaining = Math.max(0, threshold - total);
  const progress = Math.min(100, (total / threshold) * 100);

  return (
    <Card className="card-gradient">
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-sm">
            {remaining > 0 ? `Spend ${currency} ${remaining.toFixed(2)} more for free shipping!` : 'You get free shipping!'}
          </p>
          <Slider value={[progress]} max={100} disabled />
        </div>
      </CardContent>
    </Card>
  );
};

interface UpsellsSectionProps {
  settings: Settings | null;
  upsellProducts: UpsellProduct[];
  currency: string;
  items: any[];
  selectedUpsells: Set<string>;
  onUpsellToggle: (productId: string, selected: boolean) => void;
}

export const UpsellsSection = ({ 
  settings, 
  upsellProducts, 
  currency, 
  items, 
  selectedUpsells, 
  onUpsellToggle 
}: UpsellsSectionProps) => {
  if (!settings?.upsellsEnabled || upsellProducts.length === 0) return null;

  // Filter out items already in cart
  const availableUpsells = upsellProducts.filter(upsell => 
    !items.find(item => item.title === upsell.product_title)
  );

  if (availableUpsells.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Frequently Bought Together</h3>
      <div className="grid grid-cols-2 gap-4">
        {availableUpsells.map((product) => (
          <Card key={product.product_id} className="card-gradient hover-lift">
            <CardContent className="p-3 space-y-2">
              <img 
                src={product.product_image} 
                alt={product.product_title}
                className="w-full h-20 object-cover rounded-md"
              />
              <h4 className="text-sm font-medium">{product.product_title}</h4>
              <p className="text-xs text-muted-foreground">{currency} {product.product_price}</p>
              <div className="flex items-center justify-between">
                <Label htmlFor={`upsell-${product.product_id}`} className="text-sm">
                  Add to Cart
                </Label>
                <Switch 
                  id={`upsell-${product.product_id}`}
                  checked={selectedUpsells.has(product.product_id)}
                  onCheckedChange={(checked) => onUpsellToggle(product.product_id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface AddOnsSectionProps {
  settings: Settings | null;
  addOnProducts: AddOnProduct[];
  currency: string;
  selectedAddOns: Set<string>;
  onAddOnToggle: (productId: string, selected: boolean) => void;
}

export const AddOnsSection = ({ 
  settings, 
  addOnProducts, 
  currency, 
  selectedAddOns, 
  onAddOnToggle 
}: AddOnsSectionProps) => {
  if (!settings?.addOnsEnabled || addOnProducts.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Recommended Add-Ons</h3>
      <div className="space-y-3">
        {addOnProducts.map((product) => (
          <Card key={product.product_id} className="card-gradient hover-lift">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center space-x-3">
                <img 
                  src={product.product_image} 
                  alt={product.product_title}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{product.product_title}</h4>
                  <p className="text-xs text-muted-foreground">{currency} {product.product_price}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`addon-${product.product_id}`} className="text-sm">
                  Add to Cart
                </Label>
                <Switch 
                  id={`addon-${product.product_id}`}
                  checked={selectedAddOns.has(product.product_id)}
                  onCheckedChange={(checked) => onAddOnToggle(product.product_id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
