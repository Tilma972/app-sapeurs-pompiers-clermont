-- Gallery schema: photos table and RLS + storage policies (user-provided canonical version)

-- 1. Bucket for images (optional; requires Supabase storage extension)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'gallery'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'gallery',
      'gallery',
      true,
      10485760, -- 10MB limit
      ARRAY['image/jpeg','image/png','image/webp']
    );
  END IF;
END $$;

-- 2. Create table
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  image_url       text NOT NULL,
  thumbnail_url   text,
  category        text NOT NULL CHECK (category IN ('intervention','formation','detente','evenement','vie_caserne')),
  taken_at        timestamptz,
  status          text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','flagged')),
  likes_count     integer NOT NULL DEFAULT 0,
  comments_count  integer NOT NULL DEFAULT 0,
  reports_count   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- 4. Indexes for common queries
CREATE INDEX IF NOT EXISTS gallery_photos_created_at_idx ON public.gallery_photos (created_at DESC);
CREATE INDEX IF NOT EXISTS gallery_photos_category_idx   ON public.gallery_photos (category);
CREATE INDEX IF NOT EXISTS gallery_photos_user_id_idx    ON public.gallery_photos (user_id);
CREATE INDEX IF NOT EXISTS gallery_photos_status_idx     ON public.gallery_photos (status);

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Read approved photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Insert own photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Update own photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Delete own photos" ON public.gallery_photos;

-- 6. Create RLS Policies
-- Read: authenticated users can read all approved photos. Owners can see their pending/flagged ones.
CREATE POLICY "Read approved photos" ON public.gallery_photos
  FOR SELECT 
  TO authenticated
  USING (
    status = 'approved' OR user_id = auth.uid()
  );

-- Insert: only authenticated users; must insert as themselves
CREATE POLICY "Insert own photos" ON public.gallery_photos
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update: owners can update their rows
CREATE POLICY "Update own photos" ON public.gallery_photos
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Delete: owners only
CREATE POLICY "Delete own photos" ON public.gallery_photos
  FOR DELETE 
  TO authenticated
  USING (user_id = auth.uid());

-- 7. Comment
COMMENT ON TABLE public.gallery_photos IS 'Photo gallery: basic metadata and moderation counters.';
