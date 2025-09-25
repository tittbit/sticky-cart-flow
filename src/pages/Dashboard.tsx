import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/AppLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { UpsellSettings } from '@/components/settings/UpsellSettings';
import { AddOnSettings } from '@/components/settings/AddOnSettings';
import { AnalyticsSettings } from '@/components/settings/AnalyticsSettings';
import { useSettings } from '@/contexts/SettingsContext';

export const Dashboard: React.FC = () => {
  const { hasUnsavedChanges } = useSettings();

  return (
    <AppLayout 
      title="Sticky Cart Drawer" 
      subtitle="Configure your cart drawer settings and products"
    >
      <div className="space-y-6">
        {hasUnsavedChanges && (
          <Alert>
            <AlertDescription>
              You have unsaved changes. Click "Save Changes" to apply your settings.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="upsells">Upsell Products</TabsTrigger>
            <TabsTrigger value="addons">Add-On Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <GeneralSettings />
          </TabsContent>
          
          <TabsContent value="upsells" className="space-y-4">
            <UpsellSettings />
          </TabsContent>
          
          <TabsContent value="addons" className="space-y-4">
            <AddOnSettings />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};