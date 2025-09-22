import { useState } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { IntegrationStatus } from "@/components/IntegrationStatus";
import { StickyCartButton } from "@/components/cart/StickyCartButton";
import { UnifiedCartDrawer } from "@/components/cart/UnifiedCartDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Mock cart data for React implementation
  const mockCartItems = [
    {
      id: 1,
      title: 'Premium Wireless Headphones',
      variant: 'Black',
      price: 129.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      title: 'Smartphone Case',
      variant: 'Clear',
      price: 24.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop'
    }
  ];
  
  const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Sticky Cart Drawer</h1>
                <p className="text-xs text-muted-foreground">Boost AOV with smart cart features</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="status-dot status-success"></div>
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <span>⚙️</span>
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center space-x-2">
              <span>📊</span>
              <span>Integration Status</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <IntegrationStatus />
          </TabsContent>
        </Tabs>
      </main>

      {/* React Cart Components */}
      <StickyCartButton 
        itemCount={itemCount}
        onClick={() => setIsCartOpen(true)}
        shopDomain="demo-shop.myshopify.com"
        enabled={true}
      />
      
      <UnifiedCartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={mockCartItems}
        total={cartTotal}
        shopDomain="demo-shop.myshopify.com"
      />
    </div>
  );
};

export default Index;