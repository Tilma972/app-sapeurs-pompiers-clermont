-- ============================================
-- MODULE AVANTAGES - STORAGE BUCKETS
-- Date: 2024-11-04
-- ============================================

-- ============================================
-- 1. BUCKETS CREATION
-- ============================================

-- Bucket logos partenaires (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-logos',
  'partner-logos',
  true,
  2097152, -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket images offres (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-images',
  'offer-images',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES
-- ============================================

-- PARTNER-LOGOS: Lecture publique
DROP POLICY IF EXISTS "Public can view partner logos" ON storage.objects;
CREATE POLICY "Public can view partner logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-logos');

-- PARTNER-LOGOS: Admins peuvent upload
DROP POLICY IF EXISTS "Admins can upload partner logos" ON storage.objects;
CREATE POLICY "Admins can upload partner logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'partner-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- PARTNER-LOGOS: Admins peuvent update
DROP POLICY IF EXISTS "Admins can update partner logos" ON storage.objects;
CREATE POLICY "Admins can update partner logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'partner-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- PARTNER-LOGOS: Admins peuvent delete
DROP POLICY IF EXISTS "Admins can delete partner logos" ON storage.objects;
CREATE POLICY "Admins can delete partner logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'partner-logos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- OFFER-IMAGES: Lecture publique
DROP POLICY IF EXISTS "Public can view offer images" ON storage.objects;
CREATE POLICY "Public can view offer images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'offer-images');

-- OFFER-IMAGES: Admins peuvent upload
DROP POLICY IF EXISTS "Admins can upload offer images" ON storage.objects;
CREATE POLICY "Admins can upload offer images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'offer-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- OFFER-IMAGES: Admins peuvent update
DROP POLICY IF EXISTS "Admins can update offer images" ON storage.objects;
CREATE POLICY "Admins can update offer images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'offer-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- OFFER-IMAGES: Admins peuvent delete
DROP POLICY IF EXISTS "Admins can delete offer images" ON storage.objects;
CREATE POLICY "Admins can delete offer images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'offer-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage configuré avec succès !';
  RAISE NOTICE '   - Bucket partner-logos créé (2MB max)';
  RAISE NOTICE '   - Bucket offer-images créé (5MB max)';
  RAISE NOTICE '   - Policies admins configurées';
END $$;
