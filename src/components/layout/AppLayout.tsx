import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useShopify } from '@/contexts/ShopifyContext';
import { useSettings } from '@/contexts/SettingsContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { shop } = useShopify();
  const { hasUnsavedChanges, saveSettings, loading } = useSettings();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            
            {hasUnsavedChanges && (
              <Button 
                onClick={saveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </header>
          
          <div className="flex-1 p-6">
            <div className="flex gap-6">
              <div className="flex-1">
                {children}
              </div>
              
              <div className="w-80 space-y-4">
                {shop && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shop Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Shop:</strong> {shop}</p>
                        <p><strong>Status:</strong> <span className="text-green-600">Connected</span></p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};