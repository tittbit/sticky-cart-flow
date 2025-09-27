import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, BarChart3, Plus, Zap } from 'lucide-react';
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
            <TabsTrigger value="general" className="text-xs md:text-sm py-2.5 px-3">
              <Settings className="h-4 w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">General</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="upsells" className="text-xs md:text-sm py-2.5 px-3">
              <Zap className="h-4 w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Upsells</span>
              <span className="sm:hidden">Upsell</span>
            </TabsTrigger>
            <TabsTrigger value="addons" className="text-xs md:text-sm py-2.5 px-3">
              <Plus className="h-4 w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Add-Ons</span>
              <span className="sm:hidden">Add-On</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm py-2.5 px-3">
              <BarChart3 className="h-4 w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
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