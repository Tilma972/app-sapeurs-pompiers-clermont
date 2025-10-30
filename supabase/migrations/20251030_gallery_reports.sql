-- Reports for gallery photos + auto-flag logic

CREATE TABLE IF NOT EXISTS public.gallery_photo_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photo_reports ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can insert their own reports; select own; moderators can be added later
DROP POLICY IF EXISTS "insert_own_report" ON public.gallery_photo_reports;
DROP POLICY IF EXISTS "select_own_report" ON public.gallery_photo_reports;

CREATE POLICY "insert_own_report" ON public.gallery_photo_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "select_own_report" ON public.gallery_photo_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Trigger to keep reports_count in sync and auto-flag when >= 3
CREATE OR REPLACE FUNCTION public.gallery_reports_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.gallery_photos
  SET reports_count = COALESCE(reports_count, 0) + 1,
      status = CASE WHEN COALESCE(reports_count, 0) + 1 >= 3 THEN 'flagged' ELSE status END
  WHERE id = NEW.photo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gallery_reports_after_insert ON public.gallery_photo_reports;
CREATE TRIGGER trg_gallery_reports_after_insert
AFTER INSERT ON public.gallery_photo_reports
FOR EACH ROW EXECUTE FUNCTION public.gallery_reports_after_insert();
