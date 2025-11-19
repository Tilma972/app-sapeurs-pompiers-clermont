-- Migration pour ajouter une policy RLS permettant à tous les utilisateurs
-- authentifiés de voir toutes les tournées (lecture seule pour les stats globales)

-- Ajouter une policy pour permettre la lecture de toutes les tournées
-- (utile pour les statistiques globales et leaderboards)
CREATE POLICY "Les utilisateurs authentifiés peuvent voir toutes les tournées (lecture seule)"
ON public.tournees
FOR SELECT
TO authenticated
USING (true);

-- Note: Les autres policies (INSERT, UPDATE, DELETE) restent restrictives
-- Les utilisateurs ne peuvent toujours modifier que leurs propres tournées
