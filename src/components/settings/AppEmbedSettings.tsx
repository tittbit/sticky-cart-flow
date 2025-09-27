import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useShopify } from '@/contexts/ShopifyContext';
import { useToast } from '@/hooks/use-toast';

export const AppEmbedSettings: React.FC = () => {
  const { shop } = useShopify();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const appEmbedCode = `<!-- Sticky Cart Drawer App Embed -->
<script src="${window.location.origin}/app-embed.js" defer></script>`;

  const themeEmbedCode = `{% comment %} Sticky Cart Drawer Theme Integration {% endcomment %}
{% if shop.permanent_domain == '${shop}' %}
  <script src="${window.location.origin}/app-embed.js" defer></script>
{% endif %}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${type} code copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Use one of the integration methods below to add the cart drawer to your Shopify store.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="app-embed" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2">
          <TabsTrigger value="app-embed" className="w-full">App Embed (Recommended)</TabsTrigger>
          <TabsTrigger value="theme-integration" className="w-full">Theme Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="app-embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                App Embed Integration
                <ExternalLink className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Installation Steps:</Label>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to your Shopify Admin → Online Store → Themes</li>
                  <li>Click on "Customize" for your active theme</li>
                  <li>In the theme editor, click "App embeds" in the left sidebar</li>
                  <li>Find "Sticky Cart Drawer" and toggle it on</li>
                  <li>Save your theme</li>
                </ol>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> App embed integration requires your app to be installed from the Shopify App Store or approved as a development app.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Embed Code Preview:</Label>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    <code>{appEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(appEmbedCode, 'App embed')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme-integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Theme Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Installation Steps:</Label>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to your Shopify Admin → Online Store → Themes</li>
                  <li>Click "Actions" → "Edit code" on your active theme</li>
                  <li>Open the <code>theme.liquid</code> file</li>
                  <li>Paste the code below just before the closing <code>&lt;/head&gt;</code> tag</li>
                  <li>Save the file</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label>Theme Code:</Label>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    <code>{themeEmbedCode}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(themeEmbedCode, 'Theme integration')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Manual theme integration requires you to update the code when switching themes. App embed integration is more reliable and updates automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Testing Your Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Verification Steps:</Label>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Visit your store's frontend</li>
              <li>Look for the sticky cart button (if enabled)</li>
              <li>Add a product to cart and verify the drawer opens</li>
              <li>Test all cart functions (quantity updates, remove items, etc.)</li>
              <li>Check browser console for any JavaScript errors</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => window.open(`https://${shop}`, '_blank')}
              disabled={!shop}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Store
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`https://${shop}/admin`, '_blank')}
              disabled={!shop}
            >
              Open Shopify Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};