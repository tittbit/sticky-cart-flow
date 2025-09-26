import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain');
      return;
    }

    // Clean up the shop domain
    let cleanDomain = shopDomain.toLowerCase().trim();
    if (!cleanDomain.includes('.myshopify.com')) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    setLoading(true);
    setError('');

    try {
      // Store shop domain
      localStorage.setItem('shopify_shop', cleanDomain);
      
      // In a real app, you would redirect to Shopify OAuth
      // For demo purposes, we'll simulate successful auth
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError('Failed to authenticate. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">SC</span>
          </div>
          <CardTitle className="text-2xl">Connect Your Store</CardTitle>
          <p className="text-muted-foreground">Enter your Shopify store domain to get started</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="shop">Shop Domain</Label>
            <div className="flex">
              <Input
                id="shop"
                type="text"
                placeholder="your-store"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                disabled={loading}
              />
              <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                .myshopify.com
              </div>
            </div>
          </div>

          <Button 
            onClick={handleAuth} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Store'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};