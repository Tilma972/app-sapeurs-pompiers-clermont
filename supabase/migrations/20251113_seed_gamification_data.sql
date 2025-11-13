-- =====================================================
-- SEED : Données initiales pour le système de gamification
-- =====================================================
-- Description : Badges et défis de départ
-- Date : 2025-11-13
-- =====================================================

-- =====================================================
-- BADGES INITIAUX (15 badges)
-- =====================================================

INSERT INTO badges_definitions (slug, name, description, icon, category, rarity, xp_reward, unlock_criteria, order_display) VALUES

-- ========== CATÉGORIE: DÉMARRAGE (5 badges) ==========
('first_calendar', 'Premier Pas', 'Distribue ton premier calendrier', '🎯', 'starter', 'common', 50,
 '{"type":"calendars","threshold":1}', 1),

('calendars_10', 'Débutant Motivé', 'Distribue 10 calendriers', '📅', 'starter', 'common', 100,
 '{"type":"calendars","threshold":10}', 2),

('calendars_50', 'Sapeur Actif', 'Distribue 50 calendriers', '🔥', 'starter', 'rare', 200,
 '{"type":"calendars","threshold":50}', 3),

('calendars_100', 'Centurion', 'Distribue 100 calendriers', '💯', 'starter', 'epic', 500,
 '{"type":"calendars","threshold":100}', 4),

('calendars_500', 'Légende Vivante', 'Distribue 500 calendriers', '👑', 'starter', 'legendary', 2000,
 '{"type":"calendars","threshold":500}', 5),

-- ========== CATÉGORIE: MONTANT (4 badges) ==========
('montant_50', 'Première Collecte', 'Collecte 50€ au total', '💶', 'montant', 'common', 50,
 '{"type":"montant","threshold":50}', 10),

('montant_500', 'Collecteur Confirmé', 'Collecte 500€ au total', '💰', 'montant', 'rare', 200,
 '{"type":"montant","threshold":500}', 11),

('montant_1000', 'Millionnaire (presque)', 'Collecte 1000€ au total', '🤑', 'montant', 'epic', 500,
 '{"type":"montant","threshold":1000}', 12),

('montant_5000', 'Trésor National', 'Collecte 5000€ au total', '💎', 'montant', 'legendary', 2000,
 '{"type":"montant","threshold":5000}', 13),

-- ========== CATÉGORIE: STREAK (3 badges) ==========
('streak_3', 'Bon Départ', 'Actif pendant 3 jours consécutifs', '🔥', 'streak', 'common', 100,
 '{"type":"streak","threshold":3}', 20),

('streak_7', 'Marathonien', 'Actif pendant 7 jours consécutifs', '🏃', 'streak', 'rare', 300,
 '{"type":"streak","threshold":7}', 21),

('streak_30', 'Incassable', 'Actif pendant 30 jours consécutifs', '⚡', 'streak', 'legendary', 1000,
 '{"type":"streak","threshold":30}', 22),

-- ========== CATÉGORIE: SOCIAL (2 badges) ==========
('first_idea', 'Penseur', 'Poste ta première idée', '💡', 'social', 'common', 50,
 '{"type":"ideas","threshold":1}', 30),

('likes_50', 'Supporter', 'Donne 50 likes dans la galerie', '❤️', 'social', 'rare', 200,
 '{"type":"likes","threshold":50}', 31),

-- ========== CATÉGORIE: EXCELLENCE (1 badge) ==========
('level_10', 'En Route vers le Sommet', 'Atteins le niveau 10', '⭐', 'excellence', 'rare', 500,
 '{"type":"level","threshold":10}', 40)

ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- DÉFIS INITIAUX
-- =====================================================

INSERT INTO challenges_definitions (slug, name, description, type, target_value, target_type, xp_reward, token_reward, active) VALUES

-- ========== DÉFIS QUOTIDIENS (3) ==========
('daily_calendars_5', 'Journée Productive', 'Distribue 5 calendriers aujourd''hui', 'daily', 5, 'calendars', 50, 1, TRUE),
('daily_votes_3', 'Démocrate', 'Vote sur 3 idées aujourd''hui', 'daily', 3, 'votes', 30, 1, TRUE),
('daily_likes_5', 'Ambassadeur', 'Like 5 photos aujourd''hui', 'daily', 5, 'likes', 30, 1, TRUE),

-- ========== DÉFIS HEBDOMADAIRES (4) ==========
('weekly_calendars_30', 'Semaine de Feu', 'Distribue 30 calendriers cette semaine', 'weekly', 30, 'calendars', 200, 5, TRUE),
('weekly_ideas_1', 'Créatif', 'Poste au moins 1 idée cette semaine', 'weekly', 1, 'ideas', 150, 3, TRUE),
('weekly_engagement_10', 'Actif Social', 'Cumule 10 votes + likes cette semaine', 'weekly', 10, 'engagement', 150, 3, TRUE),
('weekly_top5_team', 'Élite de l''Équipe', 'Sois dans le top 5 de ton équipe', 'weekly', 5, 'team_rank', 300, 10, TRUE),

-- ========== DÉFIS MENSUELS (2) ==========
('monthly_calendars_100', 'Champion du Mois', 'Distribue 100 calendriers ce mois', 'monthly', 100, 'calendars', 1000, 50, TRUE),
('monthly_montant_1000', 'Collecteur d''Or', 'Collecte 1000€ ce mois', 'monthly', 1000, 'montant', 1000, 50, TRUE)

ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COSMÉTIQUES DE DÉPART (titres débloquables)
-- =====================================================
-- Ces titres seront débloqués automatiquement selon le niveau
-- On ne les insère pas ici, ils seront débloqués via la logique métier

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE badges_definitions IS '15 badges initiaux répartis en 5 catégories';
COMMENT ON TABLE challenges_definitions IS '8 défis : 3 quotidiens, 3 hebdomadaires, 2 mensuels';
