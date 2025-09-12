import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "./cart/CartDrawer";
import { StickyCartButton } from "./cart/StickyCartButton";

export const CartDrawerPreview = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartItems] = useState([
    {
      id: 1,
      title: "Premium Wireless Headphones",
      variant: "Black",
      price: 129.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      title: "Smart Watch Series 5",
      variant: "Silver",
      price: 299.99,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
    },
  ]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Test your cart drawer configuration in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setIsDrawerOpen(true)}
              className="gradient-primary text-white"
            >
              Open Cart Drawer
            </Button>
            <Button variant="outline">
              Preview Mobile View
            </Button>
            <Button variant="outline">
              Test Analytics Events
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Cart Items: {itemCount}</span>
            <span>•</span>
            <span>Total: ${cartTotal.toFixed(2)}</span>
            <span>•</span>
            <Badge variant="secondary">Preview Mode</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛒</span>
              <div>
                <CardTitle className="text-base">Modern Cart Drawer</CardTitle>
                <Badge variant="default" className="mt-1 text-xs bg-success text-success-foreground">
                  Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Smooth slide-out animation with modern design
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <div>
                <CardTitle className="text-base">Product Upsells</CardTitle>
                <Badge variant="default" className="mt-1 text-xs bg-success text-success-foreground">
                  Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              "Frequently bought together" recommendations
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚚</span>
              <div>
                <CardTitle className="text-base">Free Shipping Bar</CardTitle>
                <Badge variant="default" className="mt-1 text-xs bg-success text-success-foreground">
                  Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Progress bar showing amount needed for free shipping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>Your cart drawer integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="status-dot status-success"></div>
                <div>
                  <div className="font-medium">Theme Integration</div>
                  <div className="text-sm text-muted-foreground">Script tag injected successfully</div>
                </div>
              </div>
              <Badge variant="default" className="bg-success text-success-foreground">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="status-dot status-success"></div>
                <div>
                  <div className="font-medium">Metafield Configuration</div>
                  <div className="text-sm text-muted-foreground">Settings saved to shop metafields</div>
                </div>
              </div>
              <Badge variant="default" className="bg-success text-success-foreground">
                Synced
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="status-dot status-warning"></div>
                <div>
                  <div className="font-medium">Analytics Tracking</div>
                  <div className="text-sm text-muted-foreground">Facebook Pixel needs configuration</div>
                </div>
              </div>
              <Badge variant="secondary">
                Pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cart Drawer Component */}
      <CartDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={cartItems}
        total={cartTotal}
      />

      {/* Sticky Cart Button */}
      <StickyCartButton 
        itemCount={itemCount}
        onClick={() => setIsDrawerOpen(true)}
      />
    </div>
  );
};