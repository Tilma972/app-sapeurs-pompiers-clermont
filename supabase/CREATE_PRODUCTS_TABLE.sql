-- ====================================
-- MIGRATION: Create Products Table
-- ====================================
-- ÉTAPE 1: Créer la table products
-- ====================================

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

-- ====================================
-- ÉTAPE 2: Créer les index
-- ====================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- ====================================
-- ÉTAPE 3: Activer RLS
-- ====================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ====================================
-- ÉTAPE 4: Créer les policies
-- ====================================

-- Tout le monde peut voir les produits (boutique publique)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT
  USING (true);

-- TEMPORAIRE: Seuls les utilisateurs authentifiés peuvent créer/modifier/supprimer
-- On vérifiera le rôle admin côté application
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ====================================
-- ÉTAPE 5: Créer le trigger updated_at
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ÉTAPE 6: Insérer les produits initiaux
-- ====================================

INSERT INTO public.products (name, category, description, price, stock, image_url, badge_text, badge_variant, status) VALUES
  (
    'Calendrier 2025',
    'Calendriers',
    'L''incontournable calendrier de nos sapeurs-pompiers. Un soutien direct à nos actions.',
    10.00,
    150,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/calendrier_preview.png',
    'PRÉCOMMANDE',
    'preorder',
    'in_stock'
  ),
  (
    'Écusson de l''Amicale',
    'Écussons',
    'Portez fièrement les couleurs de notre amicale avec cet écusson brodé de haute qualité.',
    7.50,
    8,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/ecusson.png',
    NULL,
    NULL,
    'low_stock'
  ),
  (
    'T-Shirt Supporteur',
    'Textiles',
    'Affichez votre soutien avec ce T-shirt en coton bio, logo de l''Amicale côté cœur.',
    20.00,
    0,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/tshirt.png',
    NULL,
    NULL,
    'out_of_stock'
  ),
  (
    'Mug de l''Amicale',
    'Autres',
    'Pour le café à la caserne ou à la maison, le mug officiel de l''Amicale.',
    12.00,
    45,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/mug.png',
    NULL,
    NULL,
    'in_stock'
  ),
  (
    'Casquette Pompiers',
    'Textiles',
    'Casquette brodée "Sapeurs-Pompiers Clermont l''Hérault". Taille unique ajustable.',
    15.00,
    32,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/casquette.png',
    NULL,
    NULL,
    'in_stock'
  ),
  (
    'Porte-clés Écusson',
    'Autres',
    'Emportez un bout de l''Amicale partout avec vous grâce à ce porte-clés en PVC souple.',
    5.00,
    120,
    'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png',
    'NOUVEAU',
    'new',
    'in_stock'
  )
ON CONFLICT DO NOTHING;

-- ====================================
-- TERMINÉ !
-- ====================================
