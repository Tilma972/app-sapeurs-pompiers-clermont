-- Gallery bans + policy to prevent banned users from inserting photos

CREATE TABLE IF NOT EXISTS public.gallery_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  banned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.gallery_bans ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can view bans" ON public.gallery_bans;
DROP POLICY IF EXISTS "Admins can ban users" ON public.gallery_bans;

CREATE POLICY "Admins can view bans" ON public.gallery_bans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderateur')
    )
  );

CREATE POLICY "Admins can ban users" ON public.gallery_bans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderateur')
    )
  );

-- Update gallery_photos insert policy to block banned users
DROP POLICY IF EXISTS "Insert own photos" ON public.gallery_photos;

CREATE POLICY "Insert own photos" ON public.gallery_photos
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND NOT EXISTS (
      SELECT 1 FROM public.gallery_bans WHERE user_id = auth.uid()
    )
  );
