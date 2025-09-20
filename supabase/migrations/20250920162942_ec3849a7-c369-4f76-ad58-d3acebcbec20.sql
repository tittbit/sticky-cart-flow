-- Create public storage bucket for cart settings files
insert into storage.buckets (id, name, public)
values ('cart-settings', 'cart-settings', true)
on conflict (id) do nothing;

-- Allow public read access to cart-settings files
create policy if not exists "Public read cart settings"
  on storage.objects
  for select
  using (bucket_id = 'cart-settings');
