-- Add upsell products table for product recommendations
CREATE TABLE public.upsell_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  product_image_url TEXT,
  target_products TEXT[] DEFAULT '{}', -- Array of product IDs this upsell applies to
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_domain, product_id)
);

-- Enable RLS
ALTER TABLE public.upsell_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on upsell_products" 
ON public.upsell_products 
FOR ALL 
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_upsell_products_updated_at
BEFORE UPDATE ON public.upsell_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update shop_configurations table to have cleaner schema
ALTER TABLE public.shop_configurations 
ADD COLUMN IF NOT EXISTS upsell_product_ids TEXT[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX idx_upsell_products_shop_domain ON public.upsell_products(shop_domain);
CREATE INDEX idx_upsell_products_active ON public.upsell_products(shop_domain, is_active);
CREATE INDEX idx_cart_analytics_shop_event ON public.cart_analytics(shop_domain, event_type);
CREATE INDEX idx_cart_analytics_created_at ON public.cart_analytics(created_at DESC);
