import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProductResourcePicker } from './ProductResourcePicker';
import { useShopify } from '@/contexts/ShopifyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddOnProduct {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: {
    originalSrc: string;
    altText?: string;
  };
  description: string;
  defaultSelected: boolean;
  isActive: boolean;
  displayOrder: number;
}

export const AddOnSettings: React.FC = () => {
  const { shop } = useShopify();
  const [addOnProducts, setAddOnProducts] = React.useState<AddOnProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAddOnProducts();
  }, [shop]);

  const loadAddOnProducts = async () => {
    if (!shop) return;

    try {
      const { data, error } = await supabase
        .from('addon_products')
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
        description: item.description || '',
        defaultSelected: item.default_selected,
        isActive: item.is_active,
        displayOrder: item.display_order,
      })) || [];

      setAddOnProducts(products);
    } catch (error) {
      console.error('Failed to load addon products:', error);
      toast.error('Failed to load addon products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelection = (products: any[]) => {
    const newAddOns = products.map((product, index) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      price: product.price,
      image: product.image,
      description: '',
      defaultSelected: false,
      isActive: true,
      displayOrder: index,
    }));
    
    setAddOnProducts(newAddOns);
  };

  const updateAddOnProduct = (index: number, updates: Partial<AddOnProduct>) => {
    const updated = [...addOnProducts];
    updated[index] = { ...updated[index], ...updates };
    setAddOnProducts(updated);
  };

  const saveAddOnProducts = async () => {
    if (!shop) return;

    try {
      const productsData = addOnProducts.map(product => ({
        product_id: product.id,
        product_handle: product.handle,
        product_title: product.title,
        product_price: parseFloat(product.price),
        product_image_url: product.image?.originalSrc || null,
        description: product.description,
        default_selected: product.defaultSelected,
        is_active: product.isActive,
        display_order: product.displayOrder,
      }));

      const { error } = await supabase.rpc('replace_addon_products', {
        p_shop_domain: shop,
        p_products: productsData,
      });

      if (error) throw error;

      toast.success('Add-on products saved successfully');
    } catch (error) {
      console.error('Failed to save addon products:', error);
      toast.error('Failed to save addon products');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading add-on products...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ProductResourcePicker
        selectedProducts={addOnProducts}
        onSelectionChange={handleProductSelection}
        title="Add-On Products"
        emptyStateText="Select products to offer as add-ons in the cart drawer"
        selectionLimit={10}
      />

      {addOnProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add-On Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {addOnProducts.map((product, index) => (
              <Card key={product.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Title</Label>
                      <Input
                        value={product.title}
                        onChange={(e) => updateAddOnProduct(index, { title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={product.price}
                        onChange={(e) => updateAddOnProduct(index, { price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={product.description}
                      onChange={(e) => updateAddOnProduct(index, { description: e.target.value })}
                      placeholder="Optional description for this add-on"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={product.defaultSelected}
                        onCheckedChange={(checked) => updateAddOnProduct(index, { defaultSelected: checked })}
                      />
                      <Label>Default Selected</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={(checked) => updateAddOnProduct(index, { isActive: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button onClick={saveAddOnProducts}>
              Save Add-On Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};