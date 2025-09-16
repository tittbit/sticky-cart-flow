import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ConfigurationPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Cart Drawer Settings
    cartDrawerEnabled: true,
    drawerPosition: "right",
    themeColor: "#3B82F6",
    
    // Sticky Button Settings
    stickyButtonEnabled: true,
    buttonPosition: "bottom-right",
    buttonText: "Cart",
    
    // Feature Toggles
    upsellsEnabled: true,
    addOnsEnabled: true,
    freeShippingBarEnabled: true,
    discountPromoEnabled: false,
    announcementsEnabled: true,
    
    // Thresholds and Values
    freeShippingThreshold: 75,
    discountCode: "SAVE10",
    announcementText: "Free shipping on orders over $75!",
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      // Persist for other pages
      localStorage.setItem('shop_domain', shop);

      const { data } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success && data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ title: 'Error', description: 'Failed to load settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();

      const { data } = await supabase.functions.invoke('shop-config', {
        method: 'POST',
        headers: { 'x-shop-domain': shop },
        body: { settings }
      });

      if (data?.success) {
        // Let preview reflect instantly
        window.dispatchEvent(new CustomEvent('shop-config:updated', { detail: settings }));
        toast({ title: 'Settings saved!', description: 'Your cart drawer configuration has been updated.' });
      } else {
        throw new Error(data?.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      id: "cartDrawer",
      title: "Cart Drawer",
      description: "Modern slide-out cart with smooth animations",
      icon: "🛒",
      enabled: settings.cartDrawerEnabled,
      key: "cartDrawerEnabled",
      badge: "Core",
    },
    {
      id: "stickyButton", 
      title: "Sticky Cart Button",
      description: "Persistent floating cart button with item count",
      icon: "📌",
      enabled: settings.stickyButtonEnabled,
      key: "stickyButtonEnabled",
      badge: null,
    },
    {
      id: "upsells",
      title: "Product Upsells",
      description: "Show recommended products in cart",
      icon: "💰",
      enabled: settings.upsellsEnabled,
      key: "upsellsEnabled",
      badge: "AOV+",
    },
    {
      id: "addOns",
      title: "Add-On Products",
      description: "Optional products like shipping insurance",
      icon: "➕",
      enabled: settings.addOnsEnabled,
      key: "addOnsEnabled",
      badge: null,
    },
    {
      id: "freeShipping",
      title: "Free Shipping Bar",
      description: "Progress bar showing shipping threshold",
      icon: "🚚",
      enabled: settings.freeShippingBarEnabled,
      key: "freeShippingBarEnabled",
      badge: "Popular",
    },
    {
      id: "discountPromo",
      title: "Discount Promotions",
      description: "Display and apply discount codes",
      icon: "🎫",
      enabled: settings.discountPromoEnabled,
      key: "discountPromoEnabled",
      badge: "Pro",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Toggle Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureCards.map((feature) => (
          <Card key={feature.id} className="card-gradient hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    {feature.badge && (
                      <Badge 
                        variant={feature.badge === "Pro" ? "default" : "secondary"}
                        className="mt-1 text-xs"
                      >
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch
                  checked={feature.enabled}
                  onCheckedChange={(checked) => handleSettingChange(feature.key, checked)}
                />
              </div>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Detailed Configuration */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cart Drawer Settings */}
        <Card className="form-section">
          <CardHeader>
            <CardTitle>Cart Drawer Appearance</CardTitle>
            <CardDescription>Customize how your cart drawer looks and behaves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drawerPosition">Drawer Position</Label>
              <Select value={settings.drawerPosition} onValueChange={(value) => handleSettingChange("drawerPosition", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Slide from Right</SelectItem>
                  <SelectItem value="left">Slide from Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themeColor">Theme Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="themeColor"
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => handleSettingChange("themeColor", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.themeColor}
                  onChange={(e) => handleSettingChange("themeColor", e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonPosition">Sticky Button Position</Label>
              <Select value={settings.buttonPosition} onValueChange={(value) => handleSettingChange("buttonPosition", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="form-section">
          <CardHeader>
            <CardTitle>Feature Configuration</CardTitle>
            <CardDescription>Configure thresholds and promotional content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => handleSettingChange("freeShippingThreshold", Number(e.target.value))}
                placeholder="75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountCode">Discount Code</Label>
              <Input
                id="discountCode"
                value={settings.discountCode}
                onChange={(e) => handleSettingChange("discountCode", e.target.value)}
                placeholder="SAVE10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcementText">Announcement Text</Label>
              <Input
                id="announcementText"
                value={settings.announcementText}
                onChange={(e) => handleSettingChange("announcementText", e.target.value)}
                placeholder="Free shipping on orders over $75!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Sticky Button Text</Label>
              <Input
                id="buttonText"
                value={settings.buttonText}
                onChange={(e) => handleSettingChange("buttonText", e.target.value)}
                placeholder="Cart"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary text-white px-8" disabled={loading}>
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};