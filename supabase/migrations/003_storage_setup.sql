-- ==========================================
-- FILE: 003_storage_setup.sql
-- Description: Image buckets and restrictive RLS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('restaurant_images', 'restaurant_images', true),
  ('menu_items', 'menu_items', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('avatars', 'restaurant_images', 'menu_items'));

CREATE POLICY "Owner Insert Access" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND bucket_id IN ('avatars', 'restaurant_images', 'menu_items')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owner Update Access" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND bucket_id IN ('avatars', 'restaurant_images', 'menu_items')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owner Delete Access" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND bucket_id IN ('avatars', 'restaurant_images', 'menu_items')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
