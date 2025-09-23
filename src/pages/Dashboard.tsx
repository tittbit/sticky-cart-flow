import React from 'react';
import { Card, Tabs, Layout, Stack, TextContainer, Banner } from '@shopify/polaris';
import { AppLayout } from '@/components/layout/AppLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { UpsellSettings } from '@/components/settings/UpsellSettings';
import { AddOnSettings } from '@/components/settings/AddOnSettings';
import { AnalyticsSettings } from '@/components/settings/AnalyticsSettings';
import { useSettings } from '@/contexts/SettingsContext';

export const Dashboard: React.FC = () => {
  const { hasUnsavedChanges } = useSettings();
  const [selectedTab, setSelectedTab] = React.useState(0);

  const tabs = [
    {
      id: 'general',
      content: 'General Settings',
      panelID: 'general-settings-panel',
    },
    {
      id: 'upsells',
      content: 'Upsell Products',
      panelID: 'upsells-panel',
    },
    {
      id: 'addons',
      content: 'Add-On Products',
      panelID: 'addons-panel',
    },
    {
      id: 'analytics',
      content: 'Analytics',
      panelID: 'analytics-panel',
    },
  ];

  return (
    <AppLayout 
      title="Sticky Cart Drawer" 
      subtitle="Configure your cart drawer settings and products"
    >
      <Layout>
        <Layout.Section>
          {hasUnsavedChanges && (
            <Banner status="warning">
              <p>You have unsaved changes. Click "Save Changes" to apply your settings.</p>
            </Banner>
          )}
          
          <Card>
            <Tabs 
              tabs={tabs} 
              selected={selectedTab} 
              onSelect={setSelectedTab}
            >
              <Card.Section>
                {selectedTab === 0 && <GeneralSettings />}
                {selectedTab === 1 && <UpsellSettings />}
                {selectedTab === 2 && <AddOnSettings />}
                {selectedTab === 3 && <AnalyticsSettings />}
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Stack vertical>
            <Card title="Quick Setup" sectioned>
              <TextContainer>
                <p><strong>1. Configure Settings</strong></p>
                <p>Customize your cart drawer appearance and behavior in the General Settings tab.</p>
                
                <p><strong>2. Add Products</strong></p>
                <p>Select upsell and add-on products using the resource picker.</p>
                
                <p><strong>3. Install Extension</strong></p>
                <p>Enable the app embed in your theme to display the cart drawer.</p>

                <p><strong>4. Test & Launch</strong></p>
                <p>Preview your cart drawer and make final adjustments.</p>
              </TextContainer>
            </Card>

            <Card title="Integration Status" sectioned>
              <Stack vertical spacing="tight">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Theme Integration</span>
                  <span style={{ color: '#00a651' }}>✓ Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Database Configuration</span>
                  <span style={{ color: '#00a651' }}>✓ Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Analytics Tracking</span>
                  <span style={{ color: '#9c9c9c' }}>○ Not Configured</span>
                </div>
              </Stack>
            </Card>
          </Stack>
        </Layout.Section>
      </Layout>
    </AppLayout>
  );
};