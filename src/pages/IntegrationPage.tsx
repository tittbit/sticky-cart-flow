import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppEmbedSettings } from '@/components/settings/AppEmbedSettings';

export const IntegrationPage: React.FC = () => {
  return (
    <AppLayout 
      title="App Integration" 
      subtitle="Install the cart drawer on your Shopify store"
    >
      <AppEmbedSettings />
    </AppLayout>
  );
};