-- =====================================================
-- SYSTÈME DE DEMANDES DE VERSEMENT
-- =====================================================
-- Permet aux utilisateurs de demander le versement
-- de leur rétribution via virement ou carte cadeau
-- Gestion par le trésorier avec workflow de validation
-- =====================================================

-- Table des demandes de versement individuelles
CREATE TABLE IF NOT EXISTS demandes_versement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL,

  -- Montant et type de versement
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  type_versement TEXT NOT NULL CHECK (type_versement IN ('virement', 'carte_cadeau')),

  -- Informations bancaires (pour virement)
  -- Note: Dans une version production, utiliser Supabase Vault pour chiffrement
  iban TEXT,
  nom_beneficiaire TEXT,

  -- Statut et workflow
  -- en_attente: créée par l'utilisateur, en attente de validation
  -- en_cours: validée par trésorier, paiement en cours
  -- validee: obsolète (remplacé par en_cours), gardé pour compatibilité
  -- payee: paiement effectué et confirmé
  -- rejetee: refusée par le trésorier
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'en_cours', 'validee', 'payee', 'rejetee')),

  -- Traçabilité des actions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Métadonnées et notes
  notes_utilisateur TEXT,
  notes_tresorier TEXT,
  preuve_paiement_url TEXT, -- URL du justificatif de paiement uploadé par le trésorier

  -- Contrainte: IBAN requis si virement
  CONSTRAINT check_iban_if_virement CHECK (
    type_versement != 'virement' OR (iban IS NOT NULL AND nom_beneficiaire IS NOT NULL)
  ),

  -- Contrainte: montant ne peut pas dépasser le solde disponible
  -- (cette vérification sera aussi faite en application)
  CONSTRAINT check_montant_positif CHECK (montant > 0)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_demandes_versement_user_id ON demandes_versement(user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_versement_equipe_id ON demandes_versement(equipe_id);
CREATE INDEX IF NOT EXISTS idx_demandes_versement_statut ON demandes_versement(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_versement_created_at ON demandes_versement(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_demandes_versement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demandes_versement_updated_at
  BEFORE UPDATE ON demandes_versement
  FOR EACH ROW
  EXECUTE FUNCTION update_demandes_versement_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE demandes_versement ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own demandes_versement"
  ON demandes_versement
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Les utilisateurs peuvent créer leurs propres demandes
CREATE POLICY "Users can create their own demandes_versement"
  ON demandes_versement
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Les utilisateurs peuvent mettre à jour leurs propres demandes
-- Uniquement si statut = 'en_attente' (avant validation)
CREATE POLICY "Users can update their own pending demandes_versement"
  ON demandes_versement
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND statut = 'en_attente'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND statut = 'en_attente'
  );

-- Policy 4: Les trésoriers et admins peuvent voir toutes les demandes
CREATE POLICY "Tresoriers can view all demandes_versement"
  ON demandes_versement
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('tresorier', 'admin')
    )
  );

-- Policy 5: Les trésoriers et admins peuvent modifier toutes les demandes
CREATE POLICY "Tresoriers can update all demandes_versement"
  ON demandes_versement
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('tresorier', 'admin')
    )
  );

-- Policy 6: Les chefs d'équipe peuvent voir les demandes de leur équipe
CREATE POLICY "Chefs can view their team demandes_versement"
  ON demandes_versement
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chef_equipe'
      AND profiles.team_id = demandes_versement.equipe_id
    )
  );

-- =====================================================
-- FONCTION: Créer une demande de versement
-- =====================================================
-- Vérifie le solde disponible et crée la demande
-- Bloque immédiatement le montant pour éviter les surversements

CREATE OR REPLACE FUNCTION creer_demande_versement(
  p_montant DECIMAL,
  p_type_versement TEXT,
  p_iban TEXT DEFAULT NULL,
  p_nom_beneficiaire TEXT DEFAULT NULL,
  p_notes_utilisateur TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_equipe_id UUID;
  v_solde_disponible DECIMAL;
  v_demande_id UUID;
BEGIN
  -- Récupérer l'utilisateur authentifié
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Récupérer l'équipe de l'utilisateur
  SELECT team_id INTO v_equipe_id
  FROM profiles
  WHERE id = v_user_id;

  -- Vérifier le solde disponible
  SELECT COALESCE(solde_disponible, 0) INTO v_solde_disponible
  FROM comptes_sp
  WHERE user_id = v_user_id;

  IF v_solde_disponible IS NULL OR v_solde_disponible < p_montant THEN
    RAISE EXCEPTION 'Solde insuffisant. Disponible: %, Demandé: %', v_solde_disponible, p_montant;
  END IF;

  -- Vérifier que l'IBAN est fourni si virement
  IF p_type_versement = 'virement' AND (p_iban IS NULL OR p_nom_beneficiaire IS NULL) THEN
    RAISE EXCEPTION 'IBAN et nom du bénéficiaire requis pour un virement';
  END IF;

  -- Créer la demande
  INSERT INTO demandes_versement (
    user_id,
    equipe_id,
    montant,
    type_versement,
    iban,
    nom_beneficiaire,
    notes_utilisateur,
    statut
  ) VALUES (
    v_user_id,
    v_equipe_id,
    p_montant,
    p_type_versement,
    p_iban,
    p_nom_beneficiaire,
    p_notes_utilisateur,
    'en_attente'
  )
  RETURNING id INTO v_demande_id;

  -- Bloquer immédiatement le montant
  UPDATE comptes_sp
  SET
    solde_disponible = solde_disponible - p_montant,
    solde_bloque = COALESCE(solde_bloque, 0) + p_montant,
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN v_demande_id;
END;
$$;

-- =====================================================
-- FONCTION: Valider une demande (trésorier)
-- =====================================================

CREATE OR REPLACE FUNCTION valider_demande_versement(
  p_demande_id UUID,
  p_notes_tresorier TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_current_statut TEXT;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  v_user_id := auth.uid();

  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = v_user_id;

  IF v_user_role NOT IN ('tresorier', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only tresorier or admin can validate';
  END IF;

  -- Vérifier le statut actuel
  SELECT statut INTO v_current_statut
  FROM demandes_versement
  WHERE id = p_demande_id;

  IF v_current_statut IS NULL THEN
    RAISE EXCEPTION 'Demande not found';
  END IF;

  IF v_current_statut != 'en_attente' THEN
    RAISE EXCEPTION 'Demande already processed (status: %)', v_current_statut;
  END IF;

  -- Mettre à jour la demande
  UPDATE demandes_versement
  SET
    statut = 'en_cours',
    validated_at = now(),
    validated_by = v_user_id,
    notes_tresorier = p_notes_tresorier,
    updated_at = now()
  WHERE id = p_demande_id;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- FONCTION: Marquer comme payée (trésorier)
-- =====================================================

CREATE OR REPLACE FUNCTION marquer_demande_payee(
  p_demande_id UUID,
  p_preuve_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_demande RECORD;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  v_user_id := auth.uid();

  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = v_user_id;

  IF v_user_role NOT IN ('tresorier', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only tresorier or admin can mark as paid';
  END IF;

  -- Récupérer la demande
  SELECT * INTO v_demande
  FROM demandes_versement
  WHERE id = p_demande_id;

  IF v_demande.id IS NULL THEN
    RAISE EXCEPTION 'Demande not found';
  END IF;

  IF v_demande.statut NOT IN ('en_cours', 'validee') THEN
    RAISE EXCEPTION 'Demande must be validated first (current status: %)', v_demande.statut;
  END IF;

  -- Mettre à jour la demande
  UPDATE demandes_versement
  SET
    statut = 'payee',
    paid_at = now(),
    paid_by = v_user_id,
    preuve_paiement_url = p_preuve_url,
    updated_at = now()
  WHERE id = p_demande_id;

  -- Débiter définitivement le compte (solde_bloque -> 0)
  UPDATE comptes_sp
  SET
    solde_bloque = solde_bloque - v_demande.montant,
    solde_utilise = COALESCE(solde_utilise, 0) + v_demande.montant,
    updated_at = now()
  WHERE user_id = v_demande.user_id;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- FONCTION: Rejeter une demande (trésorier)
-- =====================================================

CREATE OR REPLACE FUNCTION rejeter_demande_versement(
  p_demande_id UUID,
  p_raison TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_demande RECORD;
BEGIN
  -- Vérifier que l'utilisateur est trésorier ou admin
  v_user_id := auth.uid();

  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = v_user_id;

  IF v_user_role NOT IN ('tresorier', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only tresorier or admin can reject';
  END IF;

  -- Récupérer la demande
  SELECT * INTO v_demande
  FROM demandes_versement
  WHERE id = p_demande_id;

  IF v_demande.id IS NULL THEN
    RAISE EXCEPTION 'Demande not found';
  END IF;

  IF v_demande.statut IN ('payee', 'rejetee') THEN
    RAISE EXCEPTION 'Cannot reject a demande that is already % ', v_demande.statut;
  END IF;

  -- Mettre à jour la demande
  UPDATE demandes_versement
  SET
    statut = 'rejetee',
    rejected_at = now(),
    rejected_by = v_user_id,
    rejection_reason = p_raison,
    updated_at = now()
  WHERE id = p_demande_id;

  -- Débloquer le montant (remettre dans solde disponible)
  UPDATE comptes_sp
  SET
    solde_disponible = solde_disponible + v_demande.montant,
    solde_bloque = solde_bloque - v_demande.montant,
    updated_at = now()
  WHERE user_id = v_demande.user_id;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE demandes_versement IS 'Demandes de versement des rétributions par les utilisateurs';
COMMENT ON COLUMN demandes_versement.statut IS 'en_attente: créée | en_cours: validée | payee: versée | rejetee: refusée';
COMMENT ON COLUMN demandes_versement.type_versement IS 'virement: virement bancaire | carte_cadeau: carte cadeau';
COMMENT ON COLUMN demandes_versement.iban IS 'IBAN du bénéficiaire (requis si virement) - À chiffrer en production';

COMMENT ON FUNCTION creer_demande_versement IS 'Crée une demande de versement et bloque immédiatement le montant';
COMMENT ON FUNCTION valider_demande_versement IS 'Valide une demande (trésorier) et passe en statut en_cours';
COMMENT ON FUNCTION marquer_demande_payee IS 'Marque une demande comme payée et débite définitivement le compte';
COMMENT ON FUNCTION rejeter_demande_versement IS 'Rejette une demande et débloque le montant';
