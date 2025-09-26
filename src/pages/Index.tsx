import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopify } from '@/contexts/ShopifyContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Index = () => {
  const { isAuthenticated, shop } = useShopify();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && shop) {
      // Auto-redirect to dashboard if authenticated
      navigate('/dashboard');
    }
  }, [isAuthenticated, shop, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <CardTitle className="text-2xl">Sticky Cart Drawer</CardTitle>
            <p className="text-muted-foreground">Boost AOV with smart cart features</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Please authenticate with your Shopify store to continue.
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default Index;