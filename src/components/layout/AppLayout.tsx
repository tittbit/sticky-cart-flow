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
          <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold truncate">{title}</h1>
              {subtitle && <p className="text-sm md:text-base text-muted-foreground hidden sm:block">{subtitle}</p>}
            </div>
            
            {hasUnsavedChanges && (
              <Button 
                onClick={saveSettings}
                disabled={loading}
                size="sm"
                className="ml-4 shrink-0"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </header>
          
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                {children}
              </div>
              
              <div className="w-full lg:w-80 lg:shrink-0 space-y-4">
                {shop && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Shop Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Shop:</strong> <span className="text-muted-foreground break-all">{shop}</span></p>
                        <p className="text-sm"><strong>Status:</strong> <span className="text-success">Connected</span></p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Integration Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Cart drawer script:</span> <span className="text-success">Active</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">App embed:</span> <span className="text-success">Ready</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};