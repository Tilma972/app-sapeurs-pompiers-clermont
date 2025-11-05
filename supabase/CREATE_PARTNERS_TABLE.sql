-- Create landing_partners table for managing landing page sponsor carousel
-- Note: Different from 'partners' table which is for member benefits/offers
CREATE TABLE IF NOT EXISTS public.landing_partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  website TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('platinum', 'gold', 'bronze')),
  sector TEXT NOT NULL,
  since INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.landing_partners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view landing partners (public landing page)
CREATE POLICY "Anyone can view landing_partners"
  ON public.landing_partners
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert landing partners
CREATE POLICY "Admins can insert landing_partners"
  ON public.landing_partners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update landing partners
CREATE POLICY "Admins can update landing_partners"
  ON public.landing_partners
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete landing partners
CREATE POLICY "Admins can delete landing_partners"
  ON public.landing_partners
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.landing_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial landing partners data (sponsors carousel)
INSERT INTO public.landing_partners (name, logo, website, tier, sector, since) VALUES
  ('Électricité Hérault', 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/partners/electricite_herault.png', 'https://www.electricite-herault.fr', 'gold', 'Électricité', 2018),
  ('Plomberie 34', 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/partners/plomberie_34.png', 'https://www.plomberie34.fr', 'gold', 'Plomberie', 2019),
  ('EMPORUS', 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/partners/emporus.png', 'https://www.emporus.fr', 'platinum', 'Commerce', 2017),
  ('Hyper U Clermont', 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/partners/hyper_u.png', 'https://www.magasins-u.com', 'platinum', 'Grande distribution', 2016),
  ('Irripisicne', 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/partners/irripiscine.png', 'https://www.irripiscine.fr', 'bronze', 'Piscine & Irrigation', 2020);

COMMENT ON TABLE public.landing_partners IS 'Partenaires sponsors affichés dans le carousel de la landing page (différent de la table partners qui gère les avantages membres)';
