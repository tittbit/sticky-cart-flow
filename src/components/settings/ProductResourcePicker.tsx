import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Image } from 'lucide-react';

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Mock product selection for demo purposes
  const handleOpenPicker = () => {
    // In a real implementation, this would open Shopify's ResourcePicker
    // For now, we'll add mock products
    const mockProducts = [
      {
        id: 'gid://shopify/Product/1',
        handle: 'test-product-1',
        title: 'Test Product 1',
        price: '29.99',
        image: {
          originalSrc: 'https://via.placeholder.com/100',
          altText: 'Test Product 1'
        }
      },
      {
        id: 'gid://shopify/Product/2',
        handle: 'test-product-2',
        title: 'Test Product 2',
        price: '39.99',
        image: {
          originalSrc: 'https://via.placeholder.com/100',
          altText: 'Test Product 2'
        }
      }
    ];
    
    onSelectionChange([...selectedProducts, ...mockProducts.slice(0, selectionLimit - selectedProducts.length)]);
  };

  const handleRemoveProduct = useCallback((productId: string) => {
    const updatedProducts = selectedProducts.filter(product => product.id !== productId);
    onSelectionChange(updatedProducts);
  }, [selectedProducts, onSelectionChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleOpenPicker}
          disabled={selectedProducts.length >= selectionLimit}
        >
          {selectedProducts.length === 0 ? 'Select Products' : 'Add More Products'}
        </Button>

        {selectedProducts.length > 0 ? (
          <div className="space-y-3">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image.originalSrc}
                      alt={product.image.altText || product.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Handle: {product.handle} | Price: ${product.price}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleRemoveProduct(product.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {emptyStateText}
          </div>
        )}

        {selectedProducts.length >= selectionLimit && (
          <div className="text-sm text-muted-foreground">
            Maximum of {selectionLimit} products can be selected.
          </div>
        )}
      </CardContent>
    </Card>
  );
};