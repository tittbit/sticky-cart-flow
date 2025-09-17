-- Fix the function to have immutable search path
CREATE OR REPLACE FUNCTION public.increment_usage_stats(
  p_shop_domain TEXT,
  p_month DATE,
  p_cart_opens INTEGER DEFAULT 0,
  p_conversions INTEGER DEFAULT 0,
  p_orders_processed INTEGER DEFAULT 0,
  p_revenue_generated DECIMAL(12,2) DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.subscription_usage (
    shop_domain,
    month,
    cart_opens,
    conversions,
    orders_processed,
    revenue_generated
  ) VALUES (
    p_shop_domain,
    p_month,
    p_cart_opens,
    p_conversions,
    p_orders_processed,
    p_revenue_generated
  )
  ON CONFLICT (shop_domain, month)
  DO UPDATE SET
    cart_opens = subscription_usage.cart_opens + p_cart_opens,
    conversions = subscription_usage.conversions + p_conversions,
    orders_processed = subscription_usage.orders_processed + p_orders_processed,
    revenue_generated = subscription_usage.revenue_generated + p_revenue_generated,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SET search_path = public;
