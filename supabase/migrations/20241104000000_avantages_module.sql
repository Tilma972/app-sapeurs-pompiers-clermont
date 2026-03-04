-- ============================================
-- MODULE AVANTAGES - MIGRATION COMPLÈTE
-- Date: 2024-11-04
-- Version: 1.0.0
-- ============================================

-- ============================================
-- 1. TABLE PARTNERS (Partenaires)
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Infos partenaire
  nom text NOT NULL,
  logo_url text,
  cover_url text,
  description text,
  categorie text CHECK (categorie IN ('restaurant', 'loisir', 'commerce', 'service')),
  
  -- Contact
  adresse text,
  ville text,
  code_postal text,
  telephone text,
  email text,
  site_web text,
  
  -- Géolocalisation (optionnel MVP)
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  
  -- Méta
  actif boolean DEFAULT true NOT NULL,
  featured boolean DEFAULT false NOT NULL, -- Carousel à la une
  ordre integer DEFAULT 0 NOT NULL, -- Ordre affichage
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 2. TABLE PARTNER_OFFERS (Offres)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  
  -- Source (futur : API externes Swile/CSE)
  source text DEFAULT 'local' CHECK (source IN ('local', 'swile', 'cse')),
  external_id text,
  
  -- Infos offre
  titre text NOT NULL,
  description text,
  image_url text,
  
  -- Type avantage
  type_avantage text NOT NULL CHECK (type_avantage IN ('qr_local', 'code_promo', 'cashback', 'link')),
  valeur text NOT NULL, -- "20%" ou "10€" ou "FIRE20"
  code_promo text, -- Si type = code_promo
  action_url text, -- URL externe si applicable
  
  -- Conditions
  conditions text,
  valid_from date,
  valid_until date,
  
  -- Limites usage
  limite_par_user integer, -- Nb max utilisation par pompier
  limite_globale integer, -- Nb max total
  usage_count integer DEFAULT 0 NOT NULL,
  
  -- Méta
  actif boolean DEFAULT true NOT NULL,
  featured boolean DEFAULT false NOT NULL, -- Carousel à la une
  ordre integer DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 3. TABLE OFFER_USAGE (Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS offer_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES partner_offers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  
  -- Action
  action_type text NOT NULL CHECK (action_type IN ('viewed', 'code_copied', 'qr_generated', 'redeemed')),
  
  -- QR tracking (Phase 2 : token sécurisé)
  qr_token uuid,
  validated_at timestamptz,
  expires_at timestamptz,
  
  -- Méta
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 4. INDEXES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partners_actif ON partners(actif);
CREATE INDEX IF NOT EXISTS idx_partners_featured ON partners(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_partners_categorie ON partners(categorie) WHERE actif = true;

CREATE INDEX IF NOT EXISTS idx_offers_partner_id ON partner_offers(partner_id);
CREATE INDEX IF NOT EXISTS idx_offers_actif ON partner_offers(actif);
CREATE INDEX IF NOT EXISTS idx_offers_featured ON partner_offers(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_offers_dates ON partner_offers(valid_from, valid_until) WHERE actif = true;

CREATE INDEX IF NOT EXISTS idx_usage_offer_id ON offer_usage(offer_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON offer_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_partner_user ON offer_usage(partner_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_qr_token ON offer_usage(qr_token) WHERE qr_token IS NOT NULL;

-- ============================================
-- 5. FUNCTIONS (Auto-update timestamps)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers auto-update
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_offers_updated_at ON partner_offers;
CREATE TRIGGER update_partner_offers_updated_at
  BEFORE UPDATE ON partner_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_usage ENABLE ROW LEVEL SECURITY;

-- PARTNERS: Lecture publique partenaires actifs
DROP POLICY IF EXISTS "Anyone can view active partners" ON partners;
CREATE POLICY "Anyone can view active partners"
  ON partners FOR SELECT
  USING (actif = true);

-- PARTNERS: Admins gèrent tout
DROP POLICY IF EXISTS "Admins manage partners" ON partners;
CREATE POLICY "Admins manage partners"
  ON partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- OFFERS: Lecture publique offres actives
DROP POLICY IF EXISTS "Anyone can view active offers" ON partner_offers;
CREATE POLICY "Anyone can view active offers"
  ON partner_offers FOR SELECT
  USING (actif = true);

-- OFFERS: Admins gèrent tout
DROP POLICY IF EXISTS "Admins manage offers" ON partner_offers;
CREATE POLICY "Admins manage offers"
  ON partner_offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- USAGE: Users peuvent créer usage
DROP POLICY IF EXISTS "Users can track offer usage" ON offer_usage;
CREATE POLICY "Users can track offer usage"
  ON offer_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- USAGE: Users voient leur usage
DROP POLICY IF EXISTS "Users can view own usage" ON offer_usage;
CREATE POLICY "Users can view own usage"
  ON offer_usage FOR SELECT
  USING (auth.uid() = user_id);

-- USAGE: Admins voient tout
DROP POLICY IF EXISTS "Admins view all usage" ON offer_usage;
CREATE POLICY "Admins view all usage"
  ON offer_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. SEED DATA (3 partenaires de test)
-- ============================================

-- Partenaire 1: Restaurant La Forge
INSERT INTO partners (nom, description, categorie, ville, code_postal, adresse, telephone, actif, featured, ordre) VALUES
(
  'Restaurant La Forge',
  'Restaurant traditionnel au cœur de Clermont-l''Hérault. Cuisine du terroir avec des produits locaux de qualité.',
  'restaurant',
  'Clermont-l''Hérault',
  '34800',
  '12 Avenue du Président Wilson',
  '04 67 96 23 45',
  true,
  true,
  1
);

-- Offre Restaurant La Forge
INSERT INTO partner_offers (partner_id, titre, description, type_avantage, valeur, code_promo, conditions, actif, featured, ordre) VALUES
(
  (SELECT id FROM partners WHERE nom = 'Restaurant La Forge'),
  '20% sur toute l''addition',
  'Profitez d''une réduction généreuse sur l''ensemble de nos plats et boissons. Ambiance conviviale garantie !',
  'qr_local',
  '20%',
  NULL,
  E'Valable du lundi au vendredi midi uniquement.\nNon cumulable avec autres offres ou menus du jour.\nSur présentation de la carte de pompier.',
  true,
  true,
  1
);

-- Partenaire 2: Garage AutoPro
INSERT INTO partners (nom, description, categorie, ville, code_postal, adresse, telephone, email, site_web, actif, featured, ordre) VALUES
(
  'Garage AutoPro',
  'Entretien et réparation automobile toutes marques. Équipe de mécaniciens qualifiés, devis gratuit.',
  'service',
  'Clermont-l''Hérault',
  '34800',
  'Zone Industrielle La Palustre',
  '04 67 96 45 78',
  'contact@autopro34.fr',
  'https://autopro34.fr',
  true,
  false,
  2
);

-- Offre Garage AutoPro
INSERT INTO partner_offers (partner_id, titre, description, type_avantage, valeur, code_promo, action_url, conditions, limite_par_user, actif, featured, ordre) VALUES
(
  (SELECT id FROM partners WHERE nom = 'Garage AutoPro'),
  'Vidange gratuite pour tout entretien',
  'Bénéficiez d''une vidange offerte lors de votre révision complète ou entretien programmé.',
  'code_promo',
  'Offert',
  'POMPIERS2024',
  'https://autopro34.fr/prendre-rdv',
  E'Valable sur prise de rendez-vous en ligne ou par téléphone.\nSur présentation de la carte de pompier.\nNon cumulable avec forfaits promotionnels.',
  2,
  true,
  false,
  2
);

-- Partenaire 3: Sport 2000
INSERT INTO partners (nom, description, categorie, ville, code_postal, adresse, telephone, actif, featured, ordre) VALUES
(
  'Sport 2000 Clermont',
  'Votre magasin d''équipement sportif et outdoor. Running, randonnée, fitness, sports d''équipe.',
  'commerce',
  'Clermont-l''Hérault',
  '34800',
  'Centre Commercial Carrefour',
  '04 67 96 12 89',
  true,
  false,
  3
);

-- Offre Sport 2000
INSERT INTO partner_offers (partner_id, titre, description, type_avantage, valeur, code_promo, conditions, actif, featured, ordre) VALUES
(
  (SELECT id FROM partners WHERE nom = 'Sport 2000 Clermont'),
  '15% de réduction en magasin',
  'Profitez de 15% de réduction sur tout le magasin : vêtements, chaussures, accessoires et matériel sportif.',
  'code_promo',
  '15%',
  'SP15',
  E'Valable toute l''année en magasin.\nNon cumulable avec les soldes et promotions en cours.\nSur présentation de la carte de pompier.',
  true,
  false,
  3
);

-- ============================================
-- 8. VERIFICATION
-- ============================================

-- Compter les données
DO $$
DECLARE
  partners_count integer;
  offers_count integer;
BEGIN
  SELECT COUNT(*) INTO partners_count FROM partners;
  SELECT COUNT(*) INTO offers_count FROM partner_offers;
  
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '   - % partenaires créés', partners_count;
  RAISE NOTICE '   - % offres créées', offers_count;
END $$;
