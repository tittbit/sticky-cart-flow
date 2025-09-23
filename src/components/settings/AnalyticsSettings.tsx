import React from 'react';
import { Card, FormLayout, TextField, Switch, Stack, Banner, TextContainer } from '@shopify/polaris';
import { useSettings } from '@/contexts/SettingsContext';

export const AnalyticsSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <Stack vertical>
      <Banner status="info">
        <p>Configure analytics tracking to measure cart performance and customer behavior.</p>
      </Banner>

      <Card title="Analytics Configuration" sectioned>
        <FormLayout>
          <Switch
            label="Enable Analytics Tracking"
            checked={settings.analytics.enableTracking}
            onChange={(checked) => updateSettings({
              analytics: { ...settings.analytics, enableTracking: checked }
            })}
            helpText="Enable tracking of cart events and user interactions"
          />

          <TextField
            label="Google Analytics ID"
            value={settings.analytics.googleAnalyticsId || ''}
            onChange={(value) => updateSettings({
              analytics: { ...settings.analytics, googleAnalyticsId: value }
            })}
            placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
            helpText="Your Google Analytics Measurement ID"
            autoComplete="off"
          />

          <TextField
            label="Facebook Pixel ID"
            value={settings.analytics.facebookPixelId || ''}
            onChange={(value) => updateSettings({
              analytics: { ...settings.analytics, facebookPixelId: value }
            })}
            placeholder="123456789012345"
            helpText="Your Facebook Pixel ID for conversion tracking"
            autoComplete="off"
          />
        </FormLayout>
      </Card>

      <Card title="Tracked Events" sectioned>
        <TextContainer>
          <p><strong>The following events are automatically tracked when analytics is enabled:</strong></p>
          <ul>
            <li>• Cart drawer opened/closed</li>
            <li>• Products added to cart</li>
            <li>• Products removed from cart</li>
            <li>• Quantity changes</li>
            <li>• Upsell product clicks</li>
            <li>• Add-on product selections</li>
            <li>• Checkout button clicks</li>
            <li>• Free shipping progress milestones</li>
          </ul>
          <p>All events include relevant product IDs, quantities, and values for comprehensive analysis.</p>
        </TextContainer>
      </Card>

      <Card title="Privacy & Compliance" sectioned>
        <TextContainer>
          <p><strong>Important:</strong> Ensure your privacy policy covers the tracking data collected by this app. Consider implementing cookie consent if required by your jurisdiction (GDPR, CCPA, etc.).</p>
        </TextContainer>
      </Card>
    </Stack>
  );
};