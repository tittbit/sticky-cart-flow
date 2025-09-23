import React, { useState, useCallback } from 'react';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { Button, Stack, Card, ResourceList, ResourceItem, Thumbnail, TextStyle } from '@shopify/polaris';
import { ImageMajor } from '@shopify/polaris-icons';

interface Product {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: {
    originalSrc: string;
    altText?: string;
  };
}

interface ProductResourcePickerProps {
  selectedProducts: Product[];
  onSelectionChange: (products: Product[]) => void;
  selectionLimit?: number;
  title?: string;
  emptyStateText?: string;
}

export const ProductResourcePicker: React.FC<ProductResourcePickerProps> = ({
  selectedProducts,
  onSelectionChange,
  selectionLimit = 10,
  title = "Select Products",
  emptyStateText = "No products selected",
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelection = useCallback((resources: any) => {
    const products = resources.selection.map((resource: any) => ({
      id: resource.id,
      handle: resource.handle,
      title: resource.title,
      price: resource.variants?.[0]?.price || '0.00',
      image: resource.images?.[0] ? {
        originalSrc: resource.images[0].originalSrc,
        altText: resource.images[0].altText,
      } : undefined,
    }));
    
    onSelectionChange(products);
    setPickerOpen(false);
  }, [onSelectionChange]);

  const handleRemoveProduct = useCallback((productId: string) => {
    const updatedProducts = selectedProducts.filter(product => product.id !== productId);
    onSelectionChange(updatedProducts);
  }, [selectedProducts, onSelectionChange]);

  const renderProductItem = (product: Product) => {
    const media = product.image ? (
      <Thumbnail
        source={product.image.originalSrc}
        alt={product.image.altText || product.title}
        size="small"
      />
    ) : (
      <Thumbnail
        source={ImageMajor}
        alt="No image"
        size="small"
      />
    );

    return (
      <ResourceItem
        id={product.id}
        media={media}
        accessibilityLabel={`Product ${product.title}`}
        shortcutActions={[
          {
            content: 'Remove',
            onAction: () => handleRemoveProduct(product.id),
          },
        ]}
      >
        <Stack vertical spacing="extraTight">
          <h3>
            <TextStyle variation="strong">{product.title}</TextStyle>
          </h3>
          <p>
            <TextStyle variation="subdued">
              Handle: {product.handle} | Price: ${product.price}
            </TextStyle>
          </p>
        </Stack>
      </ResourceItem>
    );
  };

  return (
    <Card title={title} sectioned>
      <Stack vertical>
        <Button
          onClick={() => setPickerOpen(true)}
          disabled={selectedProducts.length >= selectionLimit}
        >
          {selectedProducts.length === 0 ? 'Select Products' : 'Add More Products'}
        </Button>

        <ResourcePicker
          resourceType="Product"
          open={pickerOpen}
          onSelection={handleSelection}
          onCancel={() => setPickerOpen(false)}
          selectMultiple={true}
          initialSelectionIds={selectedProducts.map(p => ({ id: p.id }))}
        />

        {selectedProducts.length > 0 ? (
          <ResourceList
            resourceName={{ singular: 'product', plural: 'products' }}
            items={selectedProducts}
            renderItem={renderProductItem}
          />
        ) : (
          <Card sectioned>
            <p>{emptyStateText}</p>
          </Card>
        )}

        {selectedProducts.length >= selectionLimit && (
          <TextStyle variation="subdued">
            Maximum of {selectionLimit} products can be selected.
          </TextStyle>
        )}
      </Stack>
    </Card>
  );
};