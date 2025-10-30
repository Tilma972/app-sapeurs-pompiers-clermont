-- Storage policies for gallery bucket (separated migration)
-- This file intentionally contains only storage.objects policies for the 'gallery' bucket

-- Clean up existing versions to avoid conflicts on re-apply
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Allow authenticated users to upload into their own folder (userId/...)
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to items in the 'gallery' bucket
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- Allow users to delete their own files in the 'gallery' bucket
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
