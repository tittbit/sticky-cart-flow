import React from 'react';
import { Card, FormLayout, TextField, Switch, Stack, Button } from '@shopify/polaris';
import { ProductResourcePicker } from './ProductResourcePicker';
import { useSettings } from '@/contexts/SettingsContext';
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
    return <Card sectioned><p>Loading upsell products...</p></Card>;
  }

  return (
    <Stack vertical>
      <ProductResourcePicker
        selectedProducts={upsellProducts}
        onSelectionChange={handleProductSelection}
        title="Upsell Products"
        emptyStateText="Select products to show as upsells in the cart drawer"
        selectionLimit={10}
      />

      {upsellProducts.length > 0 && (
        <Card title="Upsell Configuration" sectioned>
          <Stack vertical>
            {upsellProducts.map((product, index) => (
              <Card key={product.id} sectioned>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField
                      label="Product Title"
                      value={product.title}
                      onChange={(value) => updateUpsellProduct(index, { title: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Price"
                      value={product.price}
                      onChange={(value) => updateUpsellProduct(index, { price: value })}
                      type="number"
                      prefix="$"
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                  
                  <Switch
                    label="Active"
                    checked={product.isActive}
                    onChange={(checked) => updateUpsellProduct(index, { isActive: checked })}
                  />
                </FormLayout>
              </Card>
            ))}
            
            <Button primary onClick={saveUpsellProducts}>
              Save Upsell Products
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};