-- Create shop_configurations table to store app settings per shop
CREATE TABLE public.shop_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics table to store cart interactions
CREATE TABLE public.cart_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'cart_open', 'cart_close', 'item_add', 'item_remove', 'checkout_click'
  session_id TEXT,
  cart_total DECIMAL(10,2),
  item_count INTEGER,
  product_id TEXT,
  variant_id TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_usage table to track monthly usage
CREATE TABLE public.subscription_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  month DATE NOT NULL, -- first day of the month
  cart_opens INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  orders_processed INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_domain, month)
);

-- Enable Row Level Security
ALTER TABLE public.shop_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies - For now, allow all operations (since we're using service key in edge functions)
-- In production, you'd want more restrictive policies based on shop authentication
CREATE POLICY "Allow all operations on shop_configurations" 
ON public.shop_configurations 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on cart_analytics" 
ON public.cart_analytics 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on subscription_usage" 
ON public.subscription_usage 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_shop_configurations_updated_at
BEFORE UPDATE ON public.shop_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
BEFORE UPDATE ON public.subscription_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_shop_configurations_shop_domain ON public.shop_configurations(shop_domain);
CREATE INDEX idx_cart_analytics_shop_domain ON public.cart_analytics(shop_domain);
CREATE INDEX idx_cart_analytics_event_type ON public.cart_analytics(event_type);
CREATE INDEX idx_cart_analytics_created_at ON public.cart_analytics(created_at);
CREATE INDEX idx_subscription_usage_shop_domain ON public.subscription_usage(shop_domain);
CREATE INDEX idx_subscription_usage_month ON public.subscription_usage(month);
