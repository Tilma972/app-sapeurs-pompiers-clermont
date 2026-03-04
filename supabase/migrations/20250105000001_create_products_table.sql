-- Create products table for shop management
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  badge_text TEXT,
  badge_variant TEXT CHECK (badge_variant IN ('preorder', 'new', 'promo')),
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read products (for public shop)
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert products
CREATE POLICY "Only admins can insert products" ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update products
CREATE POLICY "Only admins can update products" ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can delete products
CREATE POLICY "Only admins can delete products" ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial products from existing data
INSERT INTO public.products (name, category, description, price, stock, image_url, badge_text, badge_variant, status) VALUES
  ('Calendrier 2025', 'Calendriers', 'L''incontournable calendrier de nos sapeurs-pompiers. Un soutien direct à nos actions.', 10.00, 150, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/calendrier_preview.png', 'PRÉCOMMANDE', 'preorder', 'in_stock'),
  ('Écusson de l''Amicale', 'Écussons', 'Portez fièrement les couleurs de notre amicale avec cet écusson brodé de haute qualité.', 7.50, 8, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/ecusson.png', NULL, NULL, 'low_stock'),
  ('T-Shirt Supporteur', 'Textiles', 'Affichez votre soutien avec ce T-shirt en coton bio, logo de l''Amicale côté cœur.', 20.00, 0, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/tshirt.png', NULL, NULL, 'out_of_stock'),
  ('Mug de l''Amicale', 'Autres', 'Pour le café à la caserne ou à la maison, le mug officiel de l''Amicale.', 12.00, 45, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/mug.png', NULL, NULL, 'in_stock'),
  ('Casquette Pompiers', 'Textiles', 'Casquette brodée "Sapeurs-Pompiers Clermont l''Hérault". Taille unique ajustable.', 15.00, 32, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/casquette.png', NULL, NULL, 'in_stock'),
  ('Porte-clés Écusson', 'Autres', 'Emportez un bout de l''Amicale partout avec vous grâce à ce porte-clés en PVC souple.', 5.00, 120, 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png', 'NOUVEAU', 'new', 'in_stock')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.products IS 'Products available in the shop';
COMMENT ON COLUMN public.products.status IS 'Stock status: in_stock, low_stock, out_of_stock';
