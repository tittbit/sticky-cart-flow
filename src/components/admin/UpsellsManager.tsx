import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, ShoppingCart } from "lucide-react";

interface UpsellProduct {
  id?: string;
  product_id: string;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_image_url?: string;
  target_products: string[];
  is_active: boolean;
}

export const UpsellsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    loadUpsells();
  }, []);

  const loadUpsells = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      
      const { data } = await supabase.functions.invoke('upsells', {
        method: 'GET',
        headers: { 'x-shop-domain': shop }
      });

      if (data?.success) {
        setUpsellProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading upsells:', error);
      toast({ title: 'Error', description: 'Failed to load upsells.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addUpsellProduct = () => {
    setUpsellProducts(prev => [...prev, {
      product_id: '',
      product_title: '',
      product_handle: '',
      product_price: 0,
      product_image_url: '',
      target_products: [],
      is_active: true
    }]);
  };

  const updateUpsellProduct = (index: number, field: keyof UpsellProduct, value: any) => {
    setUpsellProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const removeUpsellProduct = (index: number) => {
    setUpsellProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();

      // Filter out invalid products
      const validProducts = upsellProducts.filter(p => 
        p.product_title.trim() && p.product_handle.trim() && p.product_price > 0
      );

      const { data } = await supabase.functions.invoke('upsells', {
        method: 'POST',
        headers: { 'x-shop-domain': shop },
        body: { products: validProducts }
      });

      if (data?.success) {
        toast({ title: 'Success', description: 'Upsell products saved successfully!' });
        await loadUpsells();
      } else {
        throw new Error(data?.error || 'Failed to save upsells');
      }
    } catch (error) {
      console.error('Error saving upsells:', error);
      toast({ title: 'Error', description: 'Failed to save upsells. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Product Upsells Manager
              </CardTitle>
              <CardDescription>
                Configure products to show as upsells in the cart drawer
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {upsellProducts.length} Products
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {upsellProducts.map((product, index) => (
          <Card key={index} className="form-section">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium">Upsell Product {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeUpsellProduct(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${index}`}>Product Title</Label>
                  <Input
                    id={`title-${index}`}
                    value={product.product_title}
                    onChange={(e) => updateUpsellProduct(index, 'product_title', e.target.value)}
                    placeholder="Premium Screen Protector"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`handle-${index}`}>Product Handle</Label>
                  <Input
                    id={`handle-${index}`}
                    value={product.product_handle}
                    onChange={(e) => updateUpsellProduct(index, 'product_handle', e.target.value)}
                    placeholder="premium-screen-protector"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${index}`}>Price ($)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={product.product_price}
                    onChange={(e) => updateUpsellProduct(index, 'product_price', parseFloat(e.target.value) || 0)}
                    placeholder="19.99"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`image-${index}`}>Image URL</Label>
                  <Input
                    id={`image-${index}`}
                    value={product.product_image_url}
                    onChange={(e) => updateUpsellProduct(index, 'product_image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor={`targets-${index}`}>Target Product IDs (comma-separated)</Label>
                <Input
                  id={`targets-${index}`}
                  value={product.target_products.join(', ')}
                  onChange={(e) => updateUpsellProduct(index, 'target_products', 
                    e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  )}
                  placeholder="123456789, 987654321"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to show this upsell for all products
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={addUpsellProduct}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Upsell Product
          </Button>

          <Button 
            onClick={handleSave} 
            className="gradient-primary text-white px-8" 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Upsells"}
          </Button>
        </div>
      </div>

      {upsellProducts.length === 0 && (
        <Card className="card-gradient">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Upsell Products</h3>
            <p className="text-muted-foreground mb-4">
              Add products that will be recommended to customers in their cart drawer
            </p>
            <Button onClick={addUpsellProduct} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Upsell Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};