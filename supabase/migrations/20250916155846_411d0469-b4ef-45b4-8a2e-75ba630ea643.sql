-- Create separate table for add-on products
CREATE TABLE public.addon_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  product_image_url TEXT,
  description TEXT,
  default_selected BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.addon_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on addon_products" 
ON public.addon_products 
FOR ALL 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_addon_products_updated_at
BEFORE UPDATE ON public.addon_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
