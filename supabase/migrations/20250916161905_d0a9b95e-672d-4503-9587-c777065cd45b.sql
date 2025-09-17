-- Create transactional replace functions to avoid data loss when saving arrays
CREATE OR REPLACE FUNCTION public.replace_upsell_products(p_shop_domain text, p_products jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure we always run in a transaction; on any error, nothing gets deleted
  DELETE FROM public.upsell_products WHERE shop_domain = p_shop_domain;

  IF p_products IS NULL OR jsonb_typeof(p_products) <> 'array' THEN
    RETURN;
  END IF;

  INSERT INTO public.upsell_products (
    shop_domain,
    product_id,
    product_handle,
    product_title,
    product_price,
    product_image_url,
    target_products,
    is_active,
    display_order
  )
  SELECT
    p_shop_domain,
    NULLIF(elem->>'product_id','')::text,
    NULLIF(elem->>'product_handle','')::text,
    NULLIF(elem->>'product_title','')::text,
    COALESCE(NULLIF(elem->>'product_price','')::numeric, 0),
    NULLIF(elem->>'product_image_url','')::text,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(elem->'target_products')), ARRAY[]::text[]),
    COALESCE((elem->>'is_active')::boolean, true),
    COALESCE(NULLIF(elem->>'display_order','')::int, 0)
  FROM jsonb_array_elements(p_products) AS elem;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_addon_products(p_shop_domain text, p_products jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.addon_products WHERE shop_domain = p_shop_domain;

  IF p_products IS NULL OR jsonb_typeof(p_products) <> 'array' THEN
    RETURN;
  END IF;

  INSERT INTO public.addon_products (
    shop_domain,
    product_id,
    product_handle,
    product_title,
    product_price,
    product_image_url,
    description,
    default_selected,
    is_active,
    display_order
  )
  SELECT
    p_shop_domain,
    NULLIF(elem->>'product_id','')::text,
    NULLIF(elem->>'product_handle','')::text,
    NULLIF(elem->>'product_title','')::text,
    COALESCE(NULLIF(elem->>'product_price','')::numeric, 0),
    NULLIF(elem->>'product_image_url','')::text,
    NULLIF(elem->>'description','')::text,
    COALESCE((elem->>'default_selected')::boolean, false),
    COALESCE((elem->>'is_active')::boolean, true),
    COALESCE(NULLIF(elem->>'display_order','')::int, 0)
  FROM jsonb_array_elements(p_products) AS elem;
END;
$$;
