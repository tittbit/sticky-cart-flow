import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProductResourcePicker } from './ProductResourcePicker';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from '@/contexts/ShopifyContext';
import { toast } from 'sonner';

interface UpsellProduct {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: {
    originalSrc: string;
    altText?: string;
  };
  targetProducts: string[];
  isActive: boolean;
  displayOrder: number;
}

export const UpsellSettings: React.FC = () => {
  const { shop } = useShopify();
  const [upsellProducts, setUpsellProducts] = React.useState<UpsellProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUpsellProducts();
  }, [shop]);

  const loadUpsellProducts = async () => {
    if (!shop) return;

    try {
      const { data, error } = await supabase
        .from('upsell_products')
        .select('*')
        .eq('shop_domain', shop)
        .order('display_order');

      if (error) throw error;

      const products = data?.map(item => ({
        id: item.product_id,
        handle: item.product_handle,
        title: item.product_title,
        price: item.product_price.toString(),
        image: item.product_image_url ? {
          originalSrc: item.product_image_url,
          altText: item.product_title,
        } : undefined,
        targetProducts: item.target_products || [],
        isActive: item.is_active,
        displayOrder: item.display_order,
      })) || [];

      setUpsellProducts(products);
    } catch (error) {
      console.error('Failed to load upsell products:', error);
      toast.error('Failed to load upsell products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelection = (products: any[]) => {
    const newUpsells = products.map((product, index) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      price: product.price,
      image: product.image,
      targetProducts: [],
      isActive: true,
      displayOrder: index,
    }));
    
    setUpsellProducts(newUpsells);
  };

  const updateUpsellProduct = (index: number, updates: Partial<UpsellProduct>) => {
    const updated = [...upsellProducts];
    updated[index] = { ...updated[index], ...updates };
    setUpsellProducts(updated);
  };

  const saveUpsellProducts = async () => {
    if (!shop) return;

    try {
      const productsData = upsellProducts.map(product => ({
        product_id: product.id,
        product_handle: product.handle,
        product_title: product.title,
        product_price: parseFloat(product.price),
        product_image_url: product.image?.originalSrc || null,
        target_products: product.targetProducts,
        is_active: product.isActive,
        display_order: product.displayOrder,
      }));

      const { error } = await supabase.rpc('replace_upsell_products', {
        p_shop_domain: shop,
        p_products: productsData,
      });

      if (error) throw error;

      toast.success('Upsell products saved successfully');
    } catch (error) {
      console.error('Failed to save upsell products:', error);
      toast.error('Failed to save upsell products');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading upsell products...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ProductResourcePicker
        selectedProducts={upsellProducts}
        onSelectionChange={handleProductSelection}
        title="Upsell Products"
        emptyStateText="Select products to show as upsells in the cart drawer"
        selectionLimit={10}
      />

      {upsellProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upsell Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {upsellProducts.map((product, index) => (
              <Card key={product.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Title</Label>
                      <Input
                        value={product.title}
                        onChange={(e) => updateUpsellProduct(index, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={product.price}
                        onChange={(e) => updateUpsellProduct(index, { price: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={(checked) => updateUpsellProduct(index, { isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button onClick={saveUpsellProducts}>
              Save Upsell Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};