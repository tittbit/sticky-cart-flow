import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "./cart/CartDrawer";
import { StickyCartButton } from "./cart/StickyCartButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CartDrawerPreview = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [cartItems] = useState([
    {
      id: 1,
      title: "Premium Wireless Headphones",
      variant: "Black",
      price: 129.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      title: "Smart Watch Series 5",
      variant: "Silver",
      price: 299.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
    },
  ]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    loadConfiguration();
    loadIntegrationStatus();

    // Live apply settings pushed from admin save
    const onConfigUpdate = (e: any) => setSettings(e.detail);
    window.addEventListener('shop-config:updated', onConfigUpdate as EventListener);

    // Periodic refresh as fallback
    const interval = setInterval(loadConfiguration, 10000);

    return () => {
      window.removeEventListener('shop-config:updated', onConfigUpdate as EventListener);
      clearInterval(interval);
    };
  }, []);

  const loadConfiguration = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      const { data } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationStatus = async () => {
    // Mock integration status - in production this would check actual integrations
    setIntegrationStatus({
      themeIntegration: {
        status: 'active',
        description: 'Cart drawer script injected successfully'
      },
      metafields: {
        status: 'synced',
        description: 'Settings synced to database'
      },
      analytics: {
        status: settings?.facebookPixelId || settings?.googleAnalyticsId ? 'connected' : 'pending',
        description: settings?.facebookPixelId || settings?.googleAnalyticsId 
          ? 'Analytics tracking configured'
          : 'Analytics integration needs configuration'
      }
    });
  };

  const testAnalytics = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      // Send test analytics event
      const { error } = await supabase.functions.invoke('analytics', {
        method: 'POST',
        headers: { 'x-shop-domain': shop },
        body: {
          eventType: 'cart_test',
          sessionId: 'preview-session',
          cartTotal: cartTotal,
          itemCount: itemCount,
          eventData: { test: true, source: 'preview' }
        }
      });

      if (error) throw error;

      toast({ title: 'Analytics Test Successful', description: 'Test event sent to analytics system' });
    } catch (error) {
      console.error('Analytics test failed:', error);
      toast({ title: 'Analytics Test Failed', description: 'Could not send test event', variant: 'destructive' });
    }
  };

  const toggleMobileView = () => {
    setIsMobileView(!isMobileView);
    toast({
      title: isMobileView ? "Desktop View" : "Mobile View",
      description: `Switched to ${isMobileView ? 'desktop' : 'mobile'} preview mode`
    });
  };

  // Get currency from settings or default to USD
  const currency = settings?.currency || 'USD';

  return (
    <div className={`space-y-6 transition-all duration-300 ${isMobileView ? 'max-w-sm mx-auto' : ''}`}>
      {/* Preview Controls */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Test your cart drawer configuration in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setIsDrawerOpen(true)}
              className="gradient-primary text-white"
            >
              Open Cart Drawer
            </Button>
            <Button 
              variant="outline"
              onClick={toggleMobileView}
            >
              {isMobileView ? '🖥️ Desktop View' : '📱 Mobile View'}
            </Button>
            <Button 
              variant="outline"
              onClick={testAnalytics}
            >
              Test Analytics Events
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Cart Items: {itemCount}</span>
            <span>•</span>
            <span>Total: {currency} {cartTotal.toFixed(2)}</span>
            <span>•</span>
            <Badge variant="secondary">
              {isMobileView ? 'Mobile Preview' : 'Desktop Preview'}
            </Badge>
            {settings && (
              <>
                <span>•</span>
                <Badge variant={settings.cartDrawerEnabled ? "default" : "destructive"}>
                  {settings.cartDrawerEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛒</span>
              <div>
                <CardTitle className="text-base">Modern Cart Drawer</CardTitle>
                <Badge 
                  variant={settings?.cartDrawerEnabled ? "default" : "secondary"} 
                  className={`mt-1 text-xs ${settings?.cartDrawerEnabled ? 'bg-success text-success-foreground' : ''}`}
                >
                  {settings?.cartDrawerEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Smooth slide-out animation with modern design
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <CardTitle className="text-base">Product Upsells</CardTitle>
                <Badge 
                  variant={settings?.upsellsEnabled ? "default" : "secondary"} 
                  className={`mt-1 text-xs ${settings?.upsellsEnabled ? 'bg-success text-success-foreground' : ''}`}
                >
                  {settings?.upsellsEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              "Frequently bought together" recommendations
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚚</span>
              <div>
                <CardTitle className="text-base">Free Shipping Bar</CardTitle>
                <Badge 
                  variant={settings?.freeShippingEnabled ? "default" : "secondary"} 
                  className={`mt-1 text-xs ${settings?.freeShippingEnabled ? 'bg-success text-success-foreground' : ''}`}
                >
                  {settings?.freeShippingEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Progress bar showing amount needed for free shipping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Your cart drawer integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className={`status-dot ${integrationStatus?.themeIntegration?.status === 'active' ? 'status-success' : 'status-warning'}`}></div>
                <div>
                  <div className="font-medium">Theme Integration</div>
                  <div className="text-sm text-muted-foreground">
                    {integrationStatus?.themeIntegration?.description || 'Loading...'}
                  </div>
                </div>
              </div>
              <Badge variant={integrationStatus?.themeIntegration?.status === 'active' ? "default" : "secondary"} 
                     className={integrationStatus?.themeIntegration?.status === 'active' ? "bg-success text-success-foreground" : ""}>
                {integrationStatus?.themeIntegration?.status === 'active' ? 'Active' : 'Pending'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className={`status-dot ${integrationStatus?.metafields?.status === 'synced' ? 'status-success' : 'status-warning'}`}></div>
                <div>
                  <div className="font-medium">Database Configuration</div>
                  <div className="text-sm text-muted-foreground">
                    {integrationStatus?.metafields?.description || 'Loading...'}
                  </div>
                </div>
              </div>
              <Badge variant={integrationStatus?.metafields?.status === 'synced' ? "default" : "secondary"}
                     className={integrationStatus?.metafields?.status === 'synced' ? "bg-success text-success-foreground" : ""}>
                {integrationStatus?.metafields?.status === 'synced' ? 'Synced' : 'Pending'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className={`status-dot ${integrationStatus?.analytics?.status === 'connected' ? 'status-success' : 'status-warning'}`}></div>
                <div>
                  <div className="font-medium">Analytics Tracking</div>
                  <div className="text-sm text-muted-foreground">
                    {integrationStatus?.analytics?.description || 'Loading...'}
                  </div>
                </div>
              </div>
              <Badge variant={integrationStatus?.analytics?.status === 'connected' ? "default" : "secondary"}
                     className={integrationStatus?.analytics?.status === 'connected' ? "bg-success text-success-foreground" : ""}>
                {integrationStatus?.analytics?.status === 'connected' ? 'Connected' : 'Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cart Drawer Component */}
      <CartDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={cartItems}
        total={cartTotal}
        position={settings?.drawerPosition}
        themeColor={settings?.themeColor}
        currency={currency}
      />

      {/* Sticky Cart Button */}
      <StickyCartButton 
        itemCount={itemCount}
        onClick={() => setIsDrawerOpen(true)}
        enabled={settings?.stickyButtonEnabled}
        position={settings?.stickyButtonPosition}
        text={settings?.stickyButtonText}
      />
    </div>
  );
};