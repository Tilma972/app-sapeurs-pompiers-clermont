-- =====================================================
-- MIGRATION: Système de demandes de pot d'équipe
-- =====================================================
-- Description:
-- Ce système permet aux chefs d'équipe de demander des fonds
-- du pot d'équipe pour des activités communes (repas, sorties, etc.)
-- Tous les membres de l'équipe peuvent voir les demandes (transparence)
-- Le trésorier valide et effectue les paiements

-- =====================================================
-- 1. TABLE: demandes_pot_equipe
-- =====================================================

CREATE TABLE IF NOT EXISTS demandes_pot_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  demandeur_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de la demande
  titre VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('repas', 'sortie', 'equipement', 'evenement', 'autre')),

  -- Statut et workflow
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (
    statut IN ('en_attente', 'en_cours', 'validee', 'payee', 'rejetee')
  ),

  -- Dates et traçabilité
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),

  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),

  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,

  -- Notes
  notes_demandeur TEXT,
  notes_tresorier TEXT,

  -- Preuve de paiement
  preuve_paiement_url TEXT,

  -- Contraintes
  CONSTRAINT valid_validated_fields CHECK (
    (validated_at IS NULL AND validated_by IS NULL) OR
    (validated_at IS NOT NULL AND validated_by IS NOT NULL)
  ),
  CONSTRAINT valid_paid_fields CHECK (
    (paid_at IS NULL AND paid_by IS NULL) OR
    (paid_at IS NOT NULL AND paid_by IS NOT NULL)
  ),
  CONSTRAINT valid_rejected_fields CHECK (
    (rejected_at IS NULL AND rejected_by IS NULL AND rejection_reason IS NULL) OR
    (rejected_at IS NOT NULL AND rejected_by IS NOT NULL AND rejection_reason IS NOT NULL)
  )
);

-- Index pour performance
CREATE INDEX idx_demandes_pot_equipe_equipe ON demandes_pot_equipe(equipe_id);
CREATE INDEX idx_demandes_pot_equipe_demandeur ON demandes_pot_equipe(demandeur_id);
CREATE INDEX idx_demandes_pot_equipe_statut ON demandes_pot_equipe(statut);
CREATE INDEX idx_demandes_pot_equipe_created ON demandes_pot_equipe(created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_demandes_pot_equipe_updated_at
  BEFORE UPDATE ON demandes_pot_equipe
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABLE: mouvements_pot_equipe
-- =====================================================
-- Historique détaillé des mouvements du pot d'équipe

CREATE TABLE IF NOT EXISTS mouvements_pot_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,

  -- Type de mouvement
  type_mouvement VARCHAR(50) NOT NULL CHECK (
    type_mouvement IN ('contribution', 'depense', 'ajustement')
  ),

  -- Montant (positif pour contribution, négatif pour dépense)
  montant DECIMAL(10,2) NOT NULL,

  -- Description
  description TEXT NOT NULL,

  -- Référence optionnelle à une demande
  demande_pot_id UUID REFERENCES demandes_pot_equipe(id) ON DELETE SET NULL,

  -- Auteur de l'opération
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Solde après opération (pour historique)
  solde_apres DECIMAL(10,2)
);

-- Index pour performance
CREATE INDEX idx_mouvements_pot_equipe_equipe ON mouvements_pot_equipe(equipe_id);
CREATE INDEX idx_mouvements_pot_equipe_created ON mouvements_pot_equipe(created_at DESC);
CREATE INDEX idx_mouvements_pot_equipe_demande ON mouvements_pot_equipe(demande_pot_id);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE demandes_pot_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_pot_equipe ENABLE ROW LEVEL SECURITY;

-- Politique de lecture des demandes: tous les membres de l'équipe peuvent voir
-- (transparence requise par la charte d'équipe)
CREATE POLICY "Membres peuvent voir demandes de leur équipe"
  ON demandes_pot_equipe
  FOR SELECT
  TO authenticated
  USING (
    equipe_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid() AND team_id IS NOT NULL
    )
  );

-- Politique de création: seuls les chefs d'équipe peuvent créer
CREATE POLICY "Chefs équipe peuvent créer demandes"
  ON demandes_pot_equipe
  FOR INSERT
  TO authenticated
  WITH CHECK (
    demandeur_id = auth.uid() AND
    equipe_id IN (
      SELECT team_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('chef_equipe', 'admin')
      AND team_id IS NOT NULL
    )
  );

-- Politique de mise à jour: trésoriers et admins uniquement
CREATE POLICY "Trésoriers peuvent modifier demandes"
  ON demandes_pot_equipe
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tresorier', 'admin')
    )
  );

-- Politique de lecture des mouvements: tous les membres de l'équipe
CREATE POLICY "Membres peuvent voir mouvements de leur équipe"
  ON mouvements_pot_equipe
  FOR SELECT
  TO authenticated
  USING (
    equipe_id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid() AND team_id IS NOT NULL
    )
  );

-- Politique d'insertion des mouvements: trésoriers uniquement
CREATE POLICY "Trésoriers peuvent créer mouvements"
  ON mouvements_pot_equipe
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tresorier', 'admin')
    )
  );

-- =====================================================
-- 4. FONCTIONS POSTGRESQL
-- =====================================================

-- Fonction: Créer une demande de pot d'équipe
CREATE OR REPLACE FUNCTION creer_demande_pot_equipe(
  p_equipe_id UUID,
  p_titre VARCHAR,
  p_description TEXT,
  p_montant DECIMAL,
  p_categorie VARCHAR,
  p_notes_demandeur TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, demande_id UUID, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demande_id UUID;
  v_equipe_solde DECIMAL;
  v_user_profile RECORD;
BEGIN
  -- Vérifier que l'utilisateur est chef d'équipe ou admin
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_profile.role NOT IN ('chef_equipe', 'admin') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Seuls les chefs d''équipe peuvent créer des demandes'::TEXT;
    RETURN;
  END IF;

  -- Vérifier que l'utilisateur est bien dans l'équipe demandée
  IF v_user_profile.team_id != p_equipe_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Vous ne pouvez créer des demandes que pour votre équipe'::TEXT;
    RETURN;
  END IF;

  -- Vérifier que l'équipe existe et récupérer son solde
  SELECT solde_pot_equipe INTO v_equipe_solde
  FROM equipes
  WHERE id = p_equipe_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Équipe introuvable'::TEXT;
    RETURN;
  END IF;

  -- Vérifier que le solde est suffisant
  IF v_equipe_solde < p_montant THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, format('Solde insuffisant. Disponible: %.2f€', v_equipe_solde)::TEXT;
    RETURN;
  END IF;

  -- Créer la demande
  INSERT INTO demandes_pot_equipe (
    equipe_id,
    demandeur_id,
    titre,
    description,
    montant,
    categorie,
    notes_demandeur,
    statut
  ) VALUES (
    p_equipe_id,
    auth.uid(),
    p_titre,
    p_description,
    p_montant,
    p_categorie,
    p_notes_demandeur,
    'en_attente'
  )
  RETURNING id INTO v_demande_id;

  RETURN QUERY SELECT TRUE, v_demande_id, NULL::TEXT;
END;
$$;

-- Fonction: Valider une demande de pot d'équipe
CREATE OR REPLACE FUNCTION valider_demande_pot_equipe(
  p_demande_id UUID,
  p_notes_tresorier TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demande RECORD;
  v_user_profile RECORD;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_profile.role NOT IN ('tresorier', 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Seuls les trésoriers peuvent valider des demandes'::TEXT;
    RETURN;
  END IF;

  -- Récupérer la demande
  SELECT * INTO v_demande
  FROM demandes_pot_equipe
  WHERE id = p_demande_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Demande introuvable'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le statut
  IF v_demande.statut != 'en_attente' THEN
    RETURN QUERY SELECT FALSE, 'Seules les demandes en attente peuvent être validées'::TEXT;
    RETURN;
  END IF;

  -- Mettre à jour la demande
  UPDATE demandes_pot_equipe
  SET
    statut = 'en_cours',
    validated_at = now(),
    validated_by = auth.uid(),
    notes_tresorier = COALESCE(p_notes_tresorier, notes_tresorier),
    updated_at = now()
  WHERE id = p_demande_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Fonction: Marquer une demande comme payée
CREATE OR REPLACE FUNCTION marquer_demande_pot_equipe_payee(
  p_demande_id UUID,
  p_preuve_paiement_url TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demande RECORD;
  v_user_profile RECORD;
  v_nouveau_solde DECIMAL;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_profile.role NOT IN ('tresorier', 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Seuls les trésoriers peuvent marquer des demandes comme payées'::TEXT;
    RETURN;
  END IF;

  -- Récupérer la demande
  SELECT * INTO v_demande
  FROM demandes_pot_equipe
  WHERE id = p_demande_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Demande introuvable'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le statut
  IF v_demande.statut NOT IN ('en_attente', 'en_cours', 'validee') THEN
    RETURN QUERY SELECT FALSE, 'Cette demande ne peut pas être marquée comme payée'::TEXT;
    RETURN;
  END IF;

  -- Débiter le pot d'équipe de manière atomique
  UPDATE equipes
  SET solde_pot_equipe = solde_pot_equipe - v_demande.montant
  WHERE id = v_demande.equipe_id
  RETURNING solde_pot_equipe INTO v_nouveau_solde;

  -- Mettre à jour la demande
  UPDATE demandes_pot_equipe
  SET
    statut = 'payee',
    paid_at = now(),
    paid_by = auth.uid(),
    preuve_paiement_url = COALESCE(p_preuve_paiement_url, preuve_paiement_url),
    updated_at = now()
  WHERE id = p_demande_id;

  -- Créer un mouvement dans l'historique
  INSERT INTO mouvements_pot_equipe (
    equipe_id,
    type_mouvement,
    montant,
    description,
    demande_pot_id,
    created_by,
    solde_apres
  ) VALUES (
    v_demande.equipe_id,
    'depense',
    -v_demande.montant,
    format('Paiement: %s - %s', v_demande.titre, v_demande.description),
    p_demande_id,
    auth.uid(),
    v_nouveau_solde
  );

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Fonction: Rejeter une demande de pot d'équipe
CREATE OR REPLACE FUNCTION rejeter_demande_pot_equipe(
  p_demande_id UUID,
  p_rejection_reason TEXT
)
RETURNS TABLE(success BOOLEAN, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demande RECORD;
  v_user_profile RECORD;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_profile.role NOT IN ('tresorier', 'admin') THEN
    RETURN QUERY SELECT FALSE, 'Seuls les trésoriers peuvent rejeter des demandes'::TEXT;
    RETURN;
  END IF;

  -- Récupérer la demande
  SELECT * INTO v_demande
  FROM demandes_pot_equipe
  WHERE id = p_demande_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Demande introuvable'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le statut
  IF v_demande.statut NOT IN ('en_attente', 'en_cours', 'validee') THEN
    RETURN QUERY SELECT FALSE, 'Cette demande ne peut pas être rejetée'::TEXT;
    RETURN;
  END IF;

  -- Mettre à jour la demande
  UPDATE demandes_pot_equipe
  SET
    statut = 'rejetee',
    rejected_at = now(),
    rejected_by = auth.uid(),
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE id = p_demande_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

-- Fonction: Ajouter un mouvement manuel au pot d'équipe
-- (pour ajustements, contributions exceptionnelles, etc.)
CREATE OR REPLACE FUNCTION ajouter_mouvement_pot_equipe(
  p_equipe_id UUID,
  p_type_mouvement VARCHAR,
  p_montant DECIMAL,
  p_description TEXT
)
RETURNS TABLE(success BOOLEAN, nouveau_solde DECIMAL, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_profile RECORD;
  v_nouveau_solde DECIMAL;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  SELECT * INTO v_user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_profile.role NOT IN ('tresorier', 'admin') THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, 'Seuls les trésoriers peuvent ajouter des mouvements'::TEXT;
    RETURN;
  END IF;

  -- Vérifier que l'équipe existe
  IF NOT EXISTS (SELECT 1 FROM equipes WHERE id = p_equipe_id) THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, 'Équipe introuvable'::TEXT;
    RETURN;
  END IF;

  -- Mettre à jour le solde de l'équipe
  UPDATE equipes
  SET solde_pot_equipe = solde_pot_equipe + p_montant
  WHERE id = p_equipe_id
  RETURNING solde_pot_equipe INTO v_nouveau_solde;

  -- Vérifier que le solde ne devient pas négatif
  IF v_nouveau_solde < 0 THEN
    RAISE EXCEPTION 'Le solde ne peut pas être négatif';
  END IF;

  -- Créer le mouvement
  INSERT INTO mouvements_pot_equipe (
    equipe_id,
    type_mouvement,
    montant,
    description,
    created_by,
    solde_apres
  ) VALUES (
    p_equipe_id,
    p_type_mouvement,
    p_montant,
    p_description,
    auth.uid(),
    v_nouveau_solde
  );

  RETURN QUERY SELECT TRUE, v_nouveau_solde, NULL::TEXT;
END;
$$;

-- =====================================================
-- 5. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE demandes_pot_equipe IS 'Demandes d''utilisation des fonds du pot d''équipe par les chefs d''équipe';
COMMENT ON TABLE mouvements_pot_equipe IS 'Historique détaillé des mouvements du pot d''équipe';

COMMENT ON COLUMN demandes_pot_equipe.categorie IS 'Catégorie de la dépense: repas, sortie, equipement, evenement, autre';
COMMENT ON COLUMN demandes_pot_equipe.statut IS 'Workflow: en_attente → en_cours → payee (ou rejetee)';
COMMENT ON COLUMN mouvements_pot_equipe.type_mouvement IS 'Type: contribution (ajout de fonds), depense (retrait), ajustement (correction)';
COMMENT ON COLUMN mouvements_pot_equipe.montant IS 'Montant positif pour contributions, négatif pour dépenses';
