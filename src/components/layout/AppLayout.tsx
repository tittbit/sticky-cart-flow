import React from 'react';
import { Page, Layout, Card, Navigation } from '@shopify/polaris';
import { useShopify } from '@/contexts/ShopifyContext';
import { useSettings } from '@/contexts/SettingsContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  primaryAction?: React.ComponentProps<typeof Page>['primaryAction'];
  secondaryActions?: React.ComponentProps<typeof Page>['secondaryActions'];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  primaryAction,
  secondaryActions,
}) => {
  const { shop } = useShopify();
  const { hasUnsavedChanges, saveSettings } = useSettings();

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: 'ViewMajor',
      url: '/',
    },
    {
      label: 'Settings',
      icon: 'SettingsMajor',
      url: '/settings',
    },
    {
      label: 'Analytics',
      icon: 'AnalyticsMajor',
      url: '/analytics',
    },
    {
      label: 'Billing',
      icon: 'CreditCardMajor',
      url: '/billing',
    },
  ];

  return (
    <div className="app-layout">
      <Page
        title={title}
        subtitle={subtitle}
        primaryAction={
          hasUnsavedChanges
            ? {
                content: 'Save Changes',
                onAction: saveSettings,
                loading: false,
              }
            : primaryAction
        }
        secondaryActions={secondaryActions}
      >
        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <Navigation location="/">
                <Navigation.Section
                  items={navigationItems}
                />
              </Navigation>
            </Card>
            
            {shop && (
              <Card title="Shop Information" sectioned>
                <p><strong>Shop:</strong> {shop}</p>
                <p><strong>Status:</strong> <span className="text-green-600">Connected</span></p>
              </Card>
            )}
          </Layout.Section>

          <Layout.Section>
            {children}
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
};