-- =====================================================
-- Storage Setup for Product Images
-- =====================================================
-- This script creates the storage bucket and policies
-- for uploading product images
-- =====================================================

-- Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- =====================================================
-- Storage Policies
-- =====================================================

-- Allow users to upload their own images
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- Allow users to update their own images
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  split_part(name, '/', 1) = auth.uid()::text
);

-- Allow public read access to all images (bucket is public)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'product-images';
