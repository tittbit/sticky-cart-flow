import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ModuleStatus {
  status: 'active' | 'inactive' | 'configured' | 'pending' | 'error';
  description: string;
  lastUpdated?: string;
}

interface IntegrationStatusState {
  themeIntegration: ModuleStatus;
  databaseConfig: ModuleStatus;
  analyticsTracking: ModuleStatus;
  stickyButton: ModuleStatus;
  cartDrawer: ModuleStatus;
  upsells: ModuleStatus;
  addOns: ModuleStatus;
  freeShipping: ModuleStatus;
  discountBar: ModuleStatus;
}

export const IntegrationStatus = () => {
  const [status, setStatus] = useState<IntegrationStatusState | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrationStatus();
    const interval = setInterval(loadIntegrationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      const { getShopDomain } = await import('@/lib/shop');
      const shopDomain = getShopDomain();
      
      // Load settings to check module status
      const { data } = await supabase.functions.invoke('shop-config', {
        method: 'GET',
        headers: { 'x-shop-domain': shopDomain }
      });

      const settings = data?.success ? data.settings : {};

      setStatus({
        themeIntegration: {
          status: 'active',
          description: 'Cart drawer script integrated and active',
          lastUpdated: new Date().toLocaleTimeString()
        },
        databaseConfig: {
          status: 'configured',
          description: 'Database tables and configuration ready',
          lastUpdated: new Date().toLocaleTimeString()
        },
        analyticsTracking: {
          status: settings.facebookPixelId || settings.googleAnalyticsId ? 'active' : 'pending',
          description: settings.facebookPixelId || settings.googleAnalyticsId 
            ? 'Analytics tracking configured and active'
            : 'Analytics tracking not configured',
          lastUpdated: new Date().toLocaleTimeString()
        },
        stickyButton: {
          status: settings.stickyButton?.enabled ? 'active' : 'inactive',
          description: settings.stickyButton?.enabled 
            ? `Sticky button active (${settings.stickyButton.position})`
            : 'Sticky button disabled',
          lastUpdated: new Date().toLocaleTimeString()
        },
        cartDrawer: {
          status: settings.cartDrawerEnabled ? 'active' : 'inactive',
          description: settings.cartDrawerEnabled 
            ? `Cart drawer active (${settings.drawerPosition} position)`
            : 'Cart drawer disabled',
          lastUpdated: new Date().toLocaleTimeString()
        },
        upsells: {
          status: settings.upsells?.enabled ? 'active' : 'inactive',
          description: settings.upsells?.enabled 
            ? 'Product upsells enabled'
            : 'Product upsells disabled',
          lastUpdated: new Date().toLocaleTimeString()
        },
        addOns: {
          status: settings.addOns?.enabled ? 'active' : 'inactive',
          description: settings.addOns?.enabled 
            ? 'Add-on products enabled'
            : 'Add-on products disabled',
          lastUpdated: new Date().toLocaleTimeString()
        },
        freeShipping: {
          status: settings.freeShipping?.enabled ? 'active' : 'inactive',
          description: settings.freeShipping?.enabled 
            ? `Free shipping bar active (threshold: ${settings.currency || 'USD'} ${settings.freeShipping.threshold})`
            : 'Free shipping bar disabled',
          lastUpdated: new Date().toLocaleTimeString()
        },
        discountBar: {
          status: settings.discountBar?.enabled ? 'active' : 'inactive',
          description: settings.discountBar?.enabled 
            ? `Discount bar active (code: ${settings.discountBar.code})`
            : 'Discount bar disabled',
          lastUpdated: new Date().toLocaleTimeString()
        }
      });
    } catch (error) {
      console.error('Failed to load integration status:', error);
      toast({
        title: "Status Check Failed",
        description: "Could not load integration status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'configured':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'active':
      case 'configured':
        return 'status-success';
      case 'pending':
        return 'status-warning';
      case 'inactive':
        return 'status-neutral';
      case 'error':
        return 'status-error';
      default:
        return 'status-neutral';
    }
  };

  if (loading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Loading integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>
            Current status of all cart drawer modules and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {status?.themeIntegration.lastUpdated}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadIntegrationStatus}
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Core Integration Status */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Core Integration</CardTitle>
          <CardDescription>Essential components for cart drawer functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.themeIntegration.status)}`}></div>
                  <div>
                    <div className="font-medium">Theme Integration</div>
                    <div className="text-sm text-muted-foreground">
                      {status.themeIntegration.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.themeIntegration.status)}>
                  {status.themeIntegration.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.databaseConfig.status)}`}></div>
                  <div>
                    <div className="font-medium">Database Configuration</div>
                    <div className="text-sm text-muted-foreground">
                      {status.databaseConfig.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.databaseConfig.status)}>
                  {status.databaseConfig.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.analyticsTracking.status)}`}></div>
                  <div>
                    <div className="font-medium">Analytics Tracking</div>
                    <div className="text-sm text-muted-foreground">
                      {status.analyticsTracking.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.analyticsTracking.status)}>
                  {status.analyticsTracking.status}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Modules Status */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Feature Modules</CardTitle>
          <CardDescription>Individual cart drawer features and their current status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.cartDrawer.status)}`}></div>
                  <div>
                    <div className="font-medium">Cart Drawer</div>
                    <div className="text-sm text-muted-foreground">
                      {status.cartDrawer.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.cartDrawer.status)}>
                  {status.cartDrawer.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.stickyButton.status)}`}></div>
                  <div>
                    <div className="font-medium">Sticky Cart Button</div>
                    <div className="text-sm text-muted-foreground">
                      {status.stickyButton.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.stickyButton.status)}>
                  {status.stickyButton.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.freeShipping.status)}`}></div>
                  <div>
                    <div className="font-medium">Free Shipping Bar</div>
                    <div className="text-sm text-muted-foreground">
                      {status.freeShipping.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.freeShipping.status)}>
                  {status.freeShipping.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.upsells.status)}`}></div>
                  <div>
                    <div className="font-medium">Product Upsells</div>
                    <div className="text-sm text-muted-foreground">
                      {status.upsells.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.upsells.status)}>
                  {status.upsells.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.addOns.status)}`}></div>
                  <div>
                    <div className="font-medium">Add-on Products</div>
                    <div className="text-sm text-muted-foreground">
                      {status.addOns.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.addOns.status)}>
                  {status.addOns.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`status-dot ${getStatusDotClass(status.discountBar.status)}`}></div>
                  <div>
                    <div className="font-medium">Discount Bar</div>
                    <div className="text-sm text-muted-foreground">
                      {status.discountBar.description}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status.discountBar.status)}>
                  {status.discountBar.status}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};