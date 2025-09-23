import React from 'react';
import { Card, FormLayout, TextField, Switch, Stack, Button, TextContainer } from '@shopify/polaris';
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
      console.error('Failed to load add-on products:', error);
      toast.error('Failed to load add-on products');
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
      console.error('Failed to save add-on products:', error);
      toast.error('Failed to save add-on products');
    }
  };

  if (loading) {
    return <Card sectioned><p>Loading add-on products...</p></Card>;
  }

  return (
    <Stack vertical>
      <Card sectioned>
        <TextContainer>
          <p>Add-on products are shown as optional extras that customers can add to their cart. These are perfect for warranties, gift wrapping, or complementary items.</p>
        </TextContainer>
      </Card>

      <ProductResourcePicker
        selectedProducts={addOnProducts}
        onSelectionChange={handleProductSelection}
        title="Add-On Products"
        emptyStateText="Select products to show as optional add-ons in the cart drawer"
        selectionLimit={5}
      />

      {addOnProducts.length > 0 && (
        <Card title="Add-On Configuration" sectioned>
          <Stack vertical>
            {addOnProducts.map((product, index) => (
              <Card key={product.id} sectioned>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField
                      label="Product Title"
                      value={product.title}
                      onChange={(value) => updateAddOnProduct(index, { title: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Price"
                      value={product.price}
                      onChange={(value) => updateAddOnProduct(index, { price: value })}
                      type="number"
                      prefix="$"
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                  
                  <TextField
                    label="Description"
                    value={product.description}
                    onChange={(value) => updateAddOnProduct(index, { description: value })}
                    multiline={2}
                    helpText="Brief description of the add-on product"
                    autoComplete="off"
                  />
                  
                  <FormLayout.Group>
                    <Switch
                      label="Default Selected"
                      checked={product.defaultSelected}
                      onChange={(checked) => updateAddOnProduct(index, { defaultSelected: checked })}
                      helpText="Pre-select this add-on when cart opens"
                    />
                    <Switch
                      label="Active"
                      checked={product.isActive}
                      onChange={(checked) => updateAddOnProduct(index, { isActive: checked })}
                    />
                  </FormLayout.Group>
                </FormLayout>
              </Card>
            ))}
            
            <Button primary onClick={saveAddOnProducts}>
              Save Add-On Products
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};