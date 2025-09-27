import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsContext';

export const AnalyticsSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Configure analytics tracking to measure cart performance and customer behavior.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.analytics.enableTracking}
              onCheckedChange={(checked) => updateSettings({
                analytics: { ...settings.analytics, enableTracking: checked }
              })}
            />
            <Label>Enable Analytics Tracking</Label>
          </div>
          <p className="text-sm text-muted-foreground">Enable tracking of cart events and user interactions</p>

          <div className="space-y-2">
            <Label htmlFor="ga-id">Google Analytics ID</Label>
            <Input
              id="ga-id"
              value={settings.analytics.googleAnalyticsId || ''}
              onChange={(e) => updateSettings({
                analytics: { ...settings.analytics, googleAnalyticsId: e.target.value }
              })}
              placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
            />
            <p className="text-sm text-muted-foreground">Your Google Analytics Measurement ID</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
            <Input
              id="fb-pixel"
              value={settings.analytics.facebookPixelId || ''}
              onChange={(e) => updateSettings({
                analytics: { ...settings.analytics, facebookPixelId: e.target.value }
              })}
              placeholder="123456789012345"
            />
            <p className="text-sm text-muted-foreground">Your Facebook Pixel ID for conversion tracking</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Events</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <p className="font-medium mb-3">The following events are automatically tracked when analytics is enabled:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Cart drawer opened/closed</li>
            <li>• Products added to cart</li>
            <li>• Products removed from cart</li>
            <li>• Quantity changes</li>
            <li>• Upsell product clicks</li>
            <li>• Add-on product selections</li>
            <li>• Checkout button clicks</li>
            <li>• Free shipping progress milestones</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">All events include relevant product IDs, quantities, and values for comprehensive analysis.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <p className="text-sm"><strong>Important:</strong> Ensure your privacy policy covers the tracking data collected by this app. Consider implementing cookie consent if required by your jurisdiction (GDPR, CCPA, etc.).</p>
        </CardContent>
      </Card>
    </div>
  );
};