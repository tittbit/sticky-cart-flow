-- Fix security warnings: Add search_path to functions to prevent SQL injection
-- Adding security parameter SET search_path TO 'public' to the functions

CREATE OR REPLACE FUNCTION public.replace_upsell_products(p_shop_domain text, p_products jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_count int;
BEGIN
  -- Validate payload type and size BEFORE modifying data
  IF p_products IS NULL OR jsonb_typeof(p_products) <> 'array' THEN
    RAISE NOTICE 'replace_upsell_products: invalid payload type';
    RETURN;
  END IF;

  SELECT jsonb_array_length(p_products) INTO v_count;
  IF v_count IS NULL OR v_count = 0 THEN
    RAISE NOTICE 'replace_upsell_products: empty array, skipping update';
    RETURN;
  END IF;

  -- Validate required fields; raise exception to rollback if invalid
  PERFORM 1
  FROM jsonb_array_elements(p_products) AS elem
  WHERE COALESCE(NULLIF(elem->>'product_id',''), '') = ''
     OR COALESCE(NULLIF(elem->>'product_title',''), '') = ''
     OR COALESCE(NULLIF(elem->>'product_handle',''), '') = ''
     OR (elem->>'product_price') IS NULL;

  IF FOUND THEN
    RAISE EXCEPTION 'replace_upsell_products: invalid product in payload';
  END IF;

  -- Replace atomically
  DELETE FROM public.upsell_products WHERE shop_domain = p_shop_domain;

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
SET search_path TO 'public'
AS $$
DECLARE
  v_count int;
BEGIN
  -- Validate payload type and size BEFORE modifying data
  IF p_products IS NULL OR jsonb_typeof(p_products) <> 'array' THEN
    RAISE NOTICE 'replace_addon_products: invalid payload type';
    RETURN;
  END IF;

  SELECT jsonb_array_length(p_products) INTO v_count;
  IF v_count IS NULL OR v_count = 0 THEN
    RAISE NOTICE 'replace_addon_products: empty array, skipping update';
    RETURN;
  END IF;

  -- Validate required fields; raise exception to rollback if invalid
  PERFORM 1
  FROM jsonb_array_elements(p_products) AS elem
  WHERE COALESCE(NULLIF(elem->>'product_id',''), '') = ''
     OR COALESCE(NULLIF(elem->>'product_title',''), '') = ''
     OR COALESCE(NULLIF(elem->>'product_handle',''), '') = ''
     OR (elem->>'product_price') IS NULL;

  IF FOUND THEN
    RAISE EXCEPTION 'replace_addon_products: invalid product in payload';
  END IF;

  -- Replace atomically
  DELETE FROM public.addon_products WHERE shop_domain = p_shop_domain;

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