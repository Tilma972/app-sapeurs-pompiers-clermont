-- =====================================================
-- BOÎTE À IDÉES - Schema Complete
-- Date: 2025-11-04
-- Description: Tables, indexes, RLS pour module idées
-- =====================================================

-- =====================================================
-- 1. TABLE IDEAS
-- =====================================================
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu
  titre text NOT NULL CHECK (char_length(titre) >= 3 AND char_length(titre) <= 200),
  description text NOT NULL CHECK (char_length(description) >= 10),
  audio_url text, -- URL Supabase Storage si créé par vocal
  
  -- Catégorisation
  categories text[] DEFAULT '{}', -- ['Équipement', 'Formation', etc.]
  tags text[] DEFAULT '{}', -- Tags libres
  
  -- Métriques (dénormalisées pour performance)
  votes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  views_count int DEFAULT 0,
  
  -- Statut et modération
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'flagged', 'deleted')),
  anonyme boolean DEFAULT false,
  
  -- Métadonnées IA (si créé par vocal)
  ai_generated boolean DEFAULT false,
  ai_confidence_score numeric(3,2), -- 0.00 à 1.00
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  published_at timestamptz,
  
  -- Soft delete
  deleted_at timestamptz
);

-- Indexes pour performance
CREATE INDEX idx_ideas_status ON ideas(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_ideas_user_id ON ideas(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_ideas_votes_count ON ideas(votes_count DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_ideas_categories ON ideas USING GIN(categories);
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);
CREATE INDEX idx_ideas_published_at ON ideas(published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_updated_at();

-- Trigger auto-set published_at
CREATE OR REPLACE FUNCTION set_ideas_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ideas_published_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION set_ideas_published_at();

COMMENT ON TABLE ideas IS 'Table principale des idées soumises par les pompiers';
COMMENT ON COLUMN ideas.ai_generated IS 'True si l''idée a été créée via enregistrement vocal + IA';
COMMENT ON COLUMN ideas.votes_count IS 'Somme des upvotes - downvotes (calculé automatiquement)';

-- =====================================================
-- 2. TABLE IDEA_VOTES
-- =====================================================
CREATE TABLE IF NOT EXISTS idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Contrainte unique : 1 vote par user par idée
  UNIQUE(idea_id, user_id)
);

-- Indexes
CREATE INDEX idx_idea_votes_idea_id ON idea_votes(idea_id);
CREATE INDEX idx_idea_votes_user_id ON idea_votes(user_id);
CREATE INDEX idx_idea_votes_vote_type ON idea_votes(vote_type);

-- Trigger auto-update updated_at
CREATE TRIGGER trigger_idea_votes_updated_at
  BEFORE UPDATE ON idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_updated_at(); -- Réutilise la fonction

COMMENT ON TABLE idea_votes IS 'Votes des utilisateurs sur les idées (upvote/downvote)';

-- =====================================================
-- 3. TABLE IDEA_COMMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- Modération
  is_flagged boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Soft delete
  deleted_at timestamptz
);

-- Indexes
CREATE INDEX idx_idea_comments_idea_id ON idea_comments(idea_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_idea_comments_user_id ON idea_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_idea_comments_created_at ON idea_comments(created_at DESC);

-- Trigger auto-update updated_at
CREATE TRIGGER trigger_idea_comments_updated_at
  BEFORE UPDATE ON idea_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_updated_at();

COMMENT ON TABLE idea_comments IS 'Commentaires sur les idées';

-- =====================================================
-- 4. TABLE IDEA_REPORTS (Signalements)
-- =====================================================
CREATE TABLE IF NOT EXISTS idea_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES idea_comments(id) ON DELETE CASCADE,
  reporter_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'offensive', 'duplicate', 'other')),
  details text,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Au moins une des deux colonnes doit être renseignée
  CHECK (
    (idea_id IS NOT NULL AND comment_id IS NULL) OR
    (idea_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Un user ne peut signaler qu'une seule fois la même entité
  UNIQUE(reporter_user_id, idea_id),
  UNIQUE(reporter_user_id, comment_id)
);

CREATE INDEX idx_idea_reports_status ON idea_reports(status);
CREATE INDEX idx_idea_reports_created_at ON idea_reports(created_at DESC);

COMMENT ON TABLE idea_reports IS 'Signalements d''idées ou commentaires inappropriés';

-- =====================================================
-- 5. TABLE IDEA_VOTE_LOG (Rate limiting)
-- =====================================================
CREATE TABLE IF NOT EXISTS idea_vote_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  voted_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_idea_vote_log_user_id ON idea_vote_log(user_id);
CREATE INDEX idx_idea_vote_log_voted_at ON idea_vote_log(voted_at);

COMMENT ON TABLE idea_vote_log IS 'Log des votes pour rate limiting (max 50 votes/jour)';

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Fonction: Recalculer votes_count d'une idée
CREATE OR REPLACE FUNCTION recalculate_idea_votes_count(target_idea_id uuid)
RETURNS void AS $$
DECLARE
  upvotes_count int;
  downvotes_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO upvotes_count
  FROM idea_votes
  WHERE idea_id = target_idea_id AND vote_type = 'up';
  
  SELECT COUNT(*) INTO downvotes_count
  FROM idea_votes
  WHERE idea_id = target_idea_id AND vote_type = 'down';
  
  total_count := upvotes_count - downvotes_count;
  
  UPDATE ideas
  SET votes_count = total_count
  WHERE id = target_idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_idea_votes_count IS 'Recalcule le votes_count d''une idée (upvotes - downvotes)';

-- Fonction: Recalculer comments_count d'une idée
CREATE OR REPLACE FUNCTION recalculate_idea_comments_count(target_idea_id uuid)
RETURNS void AS $$
DECLARE
  total_count int;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM idea_comments
  WHERE idea_id = target_idea_id AND deleted_at IS NULL;
  
  UPDATE ideas
  SET comments_count = total_count
  WHERE id = target_idea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_idea_comments_count IS 'Recalcule le comments_count d''une idée';

-- Fonction: Vérifier rate limit votes (max 50/jour)
CREATE OR REPLACE FUNCTION check_vote_rate_limit(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  votes_last_24h int;
BEGIN
  SELECT COUNT(*) INTO votes_last_24h
  FROM idea_vote_log
  WHERE user_id = target_user_id
  AND voted_at > now() - interval '24 hours';
  
  RETURN votes_last_24h < 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_vote_rate_limit IS 'Vérifie si un user peut encore voter (max 50/24h)';

-- =====================================================
-- 7. TRIGGERS AUTO-INCREMENT COUNTERS
-- =====================================================

-- Trigger: Auto-update votes_count sur INSERT/UPDATE/DELETE vote
CREATE OR REPLACE FUNCTION trigger_update_idea_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_idea_votes_count(OLD.idea_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_idea_votes_count(NEW.idea_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_idea_votes_count
  AFTER INSERT OR UPDATE OR DELETE ON idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_idea_votes_count();

-- Trigger: Auto-update comments_count sur INSERT/UPDATE/DELETE comment
CREATE OR REPLACE FUNCTION trigger_update_idea_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_idea_comments_count(OLD.idea_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_idea_comments_count(NEW.idea_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_idea_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON idea_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_idea_comments_count();

-- Trigger: Log vote pour rate limiting
CREATE OR REPLACE FUNCTION trigger_log_vote()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO idea_vote_log (user_id, voted_at)
  VALUES (NEW.user_id, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_idea_vote_log
  AFTER INSERT ON idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_vote();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_vote_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES IDEAS
-- =====================================================

-- SELECT: Tout le monde peut voir les idées publiées
CREATE POLICY "ideas_select_published"
  ON ideas FOR SELECT
  USING (
    status = 'published' 
    AND deleted_at IS NULL
  );

-- SELECT: Users peuvent voir leurs propres idées (tous statuts)
CREATE POLICY "ideas_select_own"
  ON ideas FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Admins peuvent tout voir
CREATE POLICY "ideas_select_admin"
  ON ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Users authentifiés peuvent créer des idées
CREATE POLICY "ideas_insert_authenticated"
  ON ideas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Users peuvent modifier leurs propres idées
CREATE POLICY "ideas_update_own"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins peuvent tout modifier
CREATE POLICY "ideas_update_admin"
  ON ideas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Users peuvent soft-delete leurs idées (via UPDATE)
-- DELETE: Admins peuvent hard-delete
CREATE POLICY "ideas_delete_admin"
  ON ideas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- POLICIES IDEA_VOTES
-- =====================================================

-- SELECT: Tout le monde peut voir les votes
CREATE POLICY "idea_votes_select_all"
  ON idea_votes FOR SELECT
  USING (true);

-- INSERT: Users authentifiés peuvent voter (si rate limit OK)
CREATE POLICY "idea_votes_insert_authenticated"
  ON idea_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND check_vote_rate_limit(auth.uid())
  );

-- UPDATE: Users peuvent modifier leur vote
CREATE POLICY "idea_votes_update_own"
  ON idea_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users peuvent supprimer leur vote
CREATE POLICY "idea_votes_delete_own"
  ON idea_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES IDEA_COMMENTS
-- =====================================================

-- SELECT: Tout le monde peut voir les commentaires non supprimés
CREATE POLICY "idea_comments_select_all"
  ON idea_comments FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Users authentifiés peuvent commenter
CREATE POLICY "idea_comments_insert_authenticated"
  ON idea_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Users peuvent modifier leurs commentaires
CREATE POLICY "idea_comments_update_own"
  ON idea_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins peuvent tout modifier
CREATE POLICY "idea_comments_update_admin"
  ON idea_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Admins uniquement
CREATE POLICY "idea_comments_delete_admin"
  ON idea_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- POLICIES IDEA_REPORTS
-- =====================================================

-- SELECT: Admins uniquement
CREATE POLICY "idea_reports_select_admin"
  ON idea_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Users authentifiés peuvent signaler
CREATE POLICY "idea_reports_insert_authenticated"
  ON idea_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_user_id
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Admins uniquement
CREATE POLICY "idea_reports_update_admin"
  ON idea_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- POLICIES IDEA_VOTE_LOG
-- =====================================================

-- SELECT: Users peuvent voir leurs propres logs
CREATE POLICY "idea_vote_log_select_own"
  ON idea_vote_log FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Admins peuvent tout voir
CREATE POLICY "idea_vote_log_select_admin"
  ON idea_vote_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Géré automatiquement par trigger (pas de policy explicite nécessaire)

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
