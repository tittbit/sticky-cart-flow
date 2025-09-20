-- Create public storage bucket for cart settings files
insert into storage.buckets (id, name, public)
values ('cart-settings', 'cart-settings', true)
on conflict (id) do nothing;

-- Allow public read access to cart-settings files if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read cart settings'
  ) THEN
    CREATE POLICY "Public read cart settings"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'cart-settings');
  END IF;
END $$;
