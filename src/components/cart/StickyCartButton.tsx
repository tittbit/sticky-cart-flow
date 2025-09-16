import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface StickyCartButtonProps {
  itemCount: number;
  onClick: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  text?: string;
  shopDomain?: string;
  enabled?: boolean;
}

export const StickyCartButton = ({ 
  itemCount, 
  onClick, 
  position = "bottom-right",
  text = "Cart",
  shopDomain,
  enabled = true
}: StickyCartButtonProps) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, [shopDomain]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = shopDomain || getShopDomain();
      const { data } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success) {
        setSettings(data.settings);
      } else {
        setSettings({
          stickyButtonEnabled: true,
          stickyButtonText: 'Cart',
          stickyButtonPosition: 'bottom-right',
          themeColor: '#000000'
        });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setSettings({
        stickyButtonEnabled: true,
        stickyButtonText: 'Cart',
        stickyButtonPosition: 'bottom-right'
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if disabled or loading
  if (!enabled || loading || !settings?.stickyButtonEnabled) {
    return null;
  }

  const actualPosition = settings?.stickyButtonPosition || position;
  const actualText = settings?.stickyButtonText || text;
  const themeColor = settings?.themeColor || '#000000';
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <div className={`fixed ${positionClasses[actualPosition]} z-40`}>
      <Button
        onClick={onClick}
        className="gradient-primary text-white shadow-custom-lg hover-lift relative"
        size="lg"
        style={{
          backgroundColor: themeColor,
          borderColor: themeColor
        }}
      >
        <div className="flex items-center space-x-2">
          <span>🛒</span>
          <span className="font-medium">{actualText}</span>
        </div>
        
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 bg-accent text-accent-foreground border-2 border-background min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};