import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Package, Search } from "lucide-react";

interface AddOnProduct {
  id?: string;
  product_id: string;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_image_url?: string;
  description?: string;
  default_selected: boolean;
  is_active: boolean;
  display_order: number;
}

interface ProductSearchResult {
  id: string;
  title: string;
  handle: string;
  price: number;
  image: string | null;
}

export const AddOnsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [addOnProducts, setAddOnProducts] = useState<AddOnProduct[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Record<number, ProductSearchResult[]>>({});
  const [searchLoadingIndex, setSearchLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadAddOns();
  }, []);

  const loadAddOns = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      
      // Load from upsell_products table with add-on flag or create separate table
      const { data, error } = await supabase
        .from('upsell_products')
        .select('*')
        .eq('shop_domain', shop)
        .order('display_order');

      if (error) throw error;
      
      // Filter for add-ons (we'll use target_products empty array to indicate add-ons)
      const addOns = (data || [])
        .filter(p => p.target_products.length === 0)
        .map(p => ({
          id: p.id,
          product_id: p.product_id,
          product_title: p.product_title,
          product_handle: p.product_handle,
          product_price: p.product_price,
          product_image_url: p.product_image_url,
          description: '',
          default_selected: false,
          is_active: p.is_active,
          display_order: p.display_order
        }));

      setAddOnProducts(addOns);
      setSearchQueries(addOns.map(() => ''));
    } catch (error) {
      console.error('Error loading add-ons:', error);
      toast({ title: 'Error', description: 'Failed to load add-on products.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addAddOnProduct = () => {
    const newOrder = Math.max(...addOnProducts.map(p => p.display_order), 0) + 1;
    setAddOnProducts(prev => [...prev, {
      product_id: '',
      product_title: '',
      product_handle: '',
      product_price: 0,
      product_image_url: '',
      description: '',
      default_selected: false,
      is_active: true,
      display_order: newOrder
    }]);
    setSearchQueries(prev => [...prev, '']);
  };

  const updateAddOnProduct = (index: number, field: keyof AddOnProduct, value: any) => {
    setAddOnProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const removeAddOnProduct = (index: number) => {
    setAddOnProducts(prev => prev.filter((_, i) => i !== index));
    setSearchQueries(prev => prev.filter((_, i) => i !== index));
    setSearchResults(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const searchProducts = async (index: number) => {
    try {
      const query = searchQueries[index]?.trim();
      if (!query || query.length < 2) {
        toast({ title: 'Enter at least 2 characters', variant: 'destructive' });
        return;
      }
      setSearchLoadingIndex(index);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();
      const { data, error } = await supabase.functions.invoke('products-proxy', {
        headers: { 'x-shop-domain': shop },
        body: { action: 'search', q: query }
      });
      if (error) throw error;
      setSearchResults(prev => ({ ...prev, [index]: data?.products || [] }));
    } catch (err) {
      console.error('Search failed', err);
      toast({ title: 'Search failed', description: 'Could not fetch products', variant: 'destructive' });
    } finally {
      setSearchLoadingIndex(null);
    }
  };

  const selectProduct = (index: number, p: ProductSearchResult) => {
    updateAddOnProduct(index, 'product_id', p.id);
    updateAddOnProduct(index, 'product_title', p.title);
    updateAddOnProduct(index, 'product_handle', p.handle);
    updateAddOnProduct(index, 'product_price', p.price);
    updateAddOnProduct(index, 'product_image_url', p.image || '');
    toast({ title: 'Product selected', description: p.title });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { getShopDomain } = await import('@/lib/shop');
      const shop = getShopDomain();

      const validProducts = addOnProducts.filter(p => 
        p.product_title.trim() && p.product_handle.trim() && p.product_price > 0
      );

      // Delete existing add-ons (target_products = [])
      await supabase
        .from('upsell_products')
        .delete()
        .eq('shop_domain', shop)
        .eq('target_products', []);

      // Insert new add-ons
      if (validProducts.length > 0) {
        const { error } = await supabase
          .from('upsell_products')
          .insert(
            validProducts.map(p => ({
              shop_domain: shop,
              product_id: p.product_id,
              product_title: p.product_title,
              product_handle: p.product_handle,
              product_price: p.product_price,
              product_image_url: p.product_image_url,
              target_products: [], // Empty array indicates add-on
              is_active: p.is_active,
              display_order: p.display_order
            }))
          );

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Add-on products saved successfully!' });
      await loadAddOns();
    } catch (error) {
      console.error('Error saving add-ons:', error);
      toast({ title: 'Error', description: 'Failed to save add-on products. Please try again.', variant: 'destructive' });
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
                <Package className="w-5 h-5" />
                Add-On Products Manager
              </CardTitle>
              <CardDescription>
                Configure optional products like warranty, gift wrapping, or insurance that customers can add to their cart
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {addOnProducts.length} Add-Ons
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {addOnProducts.map((product, index) => (
          <Card key={index} className="form-section">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium">Add-On Product {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAddOnProduct(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Product search */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`addon-search-${index}`}>Search product</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`addon-search-${index}`}
                      value={searchQueries[index] || ''}
                      onChange={(e) => setSearchQueries(prev => prev.map((q, i) => i === index ? e.target.value : (q || '')))}
                      placeholder="Type product name..."
                    />
                    <Button onClick={() => searchProducts(index)} disabled={searchLoadingIndex === index}>
                      <Search className="w-4 h-4 mr-2" />
                      {searchLoadingIndex === index ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={(checked) => updateAddOnProduct(index, 'is_active', checked)}
                    />
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {searchResults[index]?.length ? (
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  {searchResults[index].map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-md border">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium line-clamp-1">{p.title}</div>
                        <div className="text-sm text-muted-foreground">{"$" + p.price.toFixed(2)}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => selectProduct(index, p)}>Select</Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Product details */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={`addon-title-${index}`}>Product Title</Label>
                  <Input
                    id={`addon-title-${index}`}
                    value={product.product_title}
                    onChange={(e) => updateAddOnProduct(index, 'product_title', e.target.value)}
                    placeholder="Extended Warranty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`addon-handle-${index}`}>Product Handle</Label>
                  <Input
                    id={`addon-handle-${index}`}
                    value={product.product_handle}
                    onChange={(e) => updateAddOnProduct(index, 'product_handle', e.target.value)}
                    placeholder="extended-warranty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`addon-price-${index}`}>Price ($)</Label>
                  <Input
                    id={`addon-price-${index}`}
                    type="number"
                    step="0.01"
                    value={product.product_price}
                    onChange={(e) => updateAddOnProduct(index, 'product_price', parseFloat(e.target.value) || 0)}
                    placeholder="9.99"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`addon-order-${index}`}>Display Order</Label>
                  <Input
                    id={`addon-order-${index}`}
                    type="number"
                    value={product.display_order}
                    onChange={(e) => updateAddOnProduct(index, 'display_order', parseInt(e.target.value) || 0)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor={`addon-image-${index}`}>Image URL</Label>
                <Input
                  id={`addon-image-${index}`}
                  value={product.product_image_url}
                  onChange={(e) => updateAddOnProduct(index, 'product_image_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor={`addon-description-${index}`}>Description (optional)</Label>
                <Input
                  id={`addon-description-${index}`}
                  value={product.description}
                  onChange={(e) => updateAddOnProduct(index, 'description', e.target.value)}
                  placeholder="Protect your purchase with extended warranty coverage"
                />
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <Switch
                  id={`addon-default-${index}`}
                  checked={product.default_selected}
                  onCheckedChange={(checked) => updateAddOnProduct(index, 'default_selected', checked)}
                />
                <Label htmlFor={`addon-default-${index}`}>Pre-selected by default</Label>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={addAddOnProduct}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Add-On Product
          </Button>

          <Button 
            onClick={handleSave} 
            className="gradient-primary text-white px-8" 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Add-Ons"}
          </Button>
        </div>
      </div>

      {addOnProducts.length === 0 && (
        <Card className="card-gradient">
          <CardContent className="pt-6 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Add-On Products</h3>
            <p className="text-muted-foreground mb-4">
              Add optional products like warranties, gift wrapping, or insurance that customers can add to their cart
            </p>
            <Button onClick={addAddOnProduct} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Add-On Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};