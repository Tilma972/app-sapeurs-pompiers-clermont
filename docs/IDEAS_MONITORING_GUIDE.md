# 📊 Boîte à Idées - Guide de Monitoring & Maintenance

Guide complet pour monitorer et maintenir la santé du système de votes et vues de la boîte à idées.

---

## 🎯 Vue d'Ensemble

Le système de boîte à idées utilise des compteurs dénormalisés (`votes_count`, `views_count`) pour la performance. Des fonctions de monitoring et réconciliation sont fournies pour garantir l'exactitude des données.

**Migrations appliquées:**
- `20251129_fix_idea_vote_log_rls.sql` - Fix RLS pour vote logging
- `20251129_fix_idea_views_counter.sql` - RPC pour incrément sécurisé des vues
- `20251129_enable_realtime_idea_votes.sql` - Realtime pour synchronisation live
- `20251129_ideas_monitoring_reconciliation.sql` - Fonctions de monitoring

---

## 🔍 Détection des Problèmes

### Vérifier les Désynchronisations de Votes

```sql
-- Lister toutes les idées avec votes_count incorrect
SELECT * FROM detect_vote_desync();
```

**Résultat:**
| idea_id | titre | stored_count | actual_count | difference | upvotes | downvotes |
|---------|-------|--------------|--------------|------------|---------|-----------|
| xxx | "Meilleure formation" | 5 | 7 | 2 | 9 | 2 |

- `stored_count`: Valeur dans `ideas.votes_count`
- `actual_count`: Vrai count calculé depuis `idea_votes`
- `difference`: Écart (positif = sous-estimé, négatif = sur-estimé)

**Quand utiliser:**
- ✅ Chaque semaine pour vérification préventive
- ✅ Après incident/bug signalé
- ✅ Avant/après maintenance importante

---

## 🔧 Correction des Désynchronisations

### Option 1: Corriger UNE Idée Spécifique

```sql
-- Corriger une idée précise
SELECT * FROM reconcile_idea_votes_single('idea-uuid-here');
```

**Résultat:**
| idea_id | old_count | new_count | upvotes | downvotes | was_fixed |
|---------|-----------|-----------|---------|-----------|-----------|
| xxx | 5 | 7 | 9 | 2 | true |

- `was_fixed = true` → Le count a été corrigé
- `was_fixed = false` → Le count était déjà correct

**Quand utiliser:**
- ✅ Un utilisateur signale un count incorrect sur une idée
- ✅ Après modification manuelle en DB
- ✅ Test unitaire d'une idée spécifique

### Option 2: Corriger TOUTES les Idées

```sql
-- Corriger toutes les désynchronisations d'un coup
SELECT * FROM reconcile_all_idea_votes();
```

**Résultat:**
| idea_id | old_count | new_count | difference |
|---------|-----------|-----------|------------|
| xxx | 5 | 7 | +2 |
| yyy | 12 | 10 | -2 |

**⚠️ ATTENTION:**
- Cette fonction met à jour TOUTES les idées désynchronisées
- Peut prendre quelques secondes sur gros volume
- À exécuter en dehors des heures de pointe

**Quand utiliser:**
- ✅ Maintenance programmée hebdomadaire/mensuelle
- ✅ Après déploiement d'un fix majeur
- ✅ Avant audit ou rapport important

---

## 📈 Statistiques & Analytics

### Stats d'un Utilisateur

```sql
-- Voir l'activité de vote d'un utilisateur
SELECT * FROM get_user_vote_stats('user-uuid-here');
```

**Résultat:**
| total_votes | upvotes | downvotes | votes_last_24h | votes_remaining | last_vote_at |
|-------------|---------|-----------|----------------|-----------------|--------------|
| 127 | 98 | 29 | 12 | 38 | 2025-11-29 14:32:00 |

**Utilité:**
- ✅ Vérifier si un user approche de la limite (50 votes/24h)
- ✅ Analyser le comportement de vote (ratio up/down)
- ✅ Débugger erreur "Rate limit dépassé"

### Top Idées par Votes

```sql
-- Top 10 idées les plus votées
SELECT * FROM get_top_ideas_by_votes(10);

-- Top 50 pour rapport mensuel
SELECT * FROM get_top_ideas_by_votes(50);
```

**Résultat:**
| idea_id | titre | votes_count | upvotes | downvotes | views_count | comments_count | author_name | created_at |
|---------|-------|-------------|---------|-----------|-------------|----------------|-------------|------------|
| xxx | "Formation secourisme" | 45 | 50 | 5 | 234 | 12 | Jean Dupont | 2025-11-15... |

**Utilité:**
- ✅ Tableau de bord admin
- ✅ Newsletter mensuelle
- ✅ Rapport aux responsables

---

## 🤖 Automatisation (Tâches Cron)

### Réconciliation Quotidienne Automatique

Si votre projet Supabase a **pg_cron** activé:

```sql
-- Créer un cron job pour réconciliation à 3h du matin chaque jour
SELECT cron.schedule(
  'reconcile-idea-votes-daily',
  '0 3 * * *', -- 3h00 tous les jours
  $$ SELECT * FROM reconcile_all_idea_votes(); $$
);

-- Vérifier les cron jobs actifs
SELECT * FROM cron.job;

-- Supprimer un cron job
SELECT cron.unschedule('reconcile-idea-votes-daily');
```

**Avantages:**
- ✅ Maintien automatique de l'intégrité
- ✅ Détection précoce de bugs
- ✅ Pas d'intervention manuelle nécessaire

**Alternative sans pg_cron:**
- Utiliser Supabase Edge Functions + cron trigger
- Script externe avec GitHub Actions
- Vercel Cron Jobs

---

## 🚨 Alertes & Monitoring

### Dashboard de Santé Rapide

```sql
-- Vue d'ensemble rapide du système
SELECT
  (SELECT COUNT(*) FROM ideas WHERE status = 'published' AND deleted_at IS NULL) AS total_ideas,
  (SELECT COUNT(*) FROM idea_votes) AS total_votes,
  (SELECT COUNT(*) FROM detect_vote_desync()) AS desync_count,
  (SELECT COUNT(*) FROM idea_vote_log WHERE voted_at > now() - interval '1 day') AS votes_last_24h,
  (SELECT AVG(votes_count)::int FROM ideas WHERE status = 'published') AS avg_votes_per_idea,
  (SELECT AVG(views_count)::int FROM ideas WHERE status = 'published') AS avg_views_per_idea;
```

**Seuils d'Alerte Recommandés:**
- 🔴 `desync_count > 10` → Problème majeur, investiguer
- 🟠 `desync_count > 5` → Monitorer de près
- 🟢 `desync_count <= 5` → Normal (quelques race conditions)

### Logs de Vote (Rate Limiting)

```sql
-- Utilisateurs les plus actifs (potentiels abus)
SELECT
  user_id,
  COUNT(*) AS votes_last_24h,
  MAX(voted_at) AS last_vote
FROM idea_vote_log
WHERE voted_at > now() - interval '1 day'
GROUP BY user_id
ORDER BY COUNT(*) DESC
LIMIT 20;
```

**Seuils d'Alerte:**
- 🔴 > 50 votes/24h → Rate limit devrait bloquer (bug?)
- 🟠 40-49 votes/24h → User très actif, surveiller
- 🟢 < 40 votes/24h → Usage normal

---

## 📊 Rapports Mensuels

### Exemple de Rapport Mensuel

```sql
-- Rapport mensuel complet
WITH monthly_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') AS new_ideas_last_month,
    COUNT(*) FILTER (WHERE status = 'published') AS published_ideas,
    SUM(votes_count) AS total_votes,
    SUM(views_count) AS total_views,
    SUM(comments_count) AS total_comments
  FROM ideas
  WHERE deleted_at IS NULL
),
top_ideas AS (
  SELECT * FROM get_top_ideas_by_votes(5)
),
active_users AS (
  SELECT COUNT(DISTINCT user_id) AS active_voters
  FROM idea_vote_log
  WHERE voted_at > now() - interval '30 days'
)
SELECT
  (SELECT row_to_json(monthly_stats.*) FROM monthly_stats) AS monthly_stats,
  (SELECT json_agg(top_ideas.*) FROM top_ideas) AS top_5_ideas,
  (SELECT row_to_json(active_users.*) FROM active_users) AS engagement;
```

**Export en CSV pour Excel:**
```sql
-- Depuis Supabase Dashboard SQL Editor, exporter en CSV
SELECT * FROM get_top_ideas_by_votes(50);
```

---

## 🛠️ Maintenance Recommandée

### Quotidienne (Automatique)
- ✅ Réconciliation automatique via cron à 3h
- ✅ Cleanup des logs > 30 jours (optionnel)

### Hebdomadaire (Manuel - 5min)
- ✅ Vérifier `detect_vote_desync()` → doit être vide ou < 5
- ✅ Vérifier logs d'erreur Supabase
- ✅ Dashboard rapide pour sanity check

### Mensuelle (Manuel - 15min)
- ✅ Générer rapport mensuel
- ✅ Analyser top ideas vs. objectifs
- ✅ Review des utilisateurs très actifs
- ✅ Backup de la table `ideas` (si pas déjà dans Supabase auto-backup)

---

## 🐛 Troubleshooting

### Problème: Vote Count à 0 après vote

**Diagnostic:**
```sql
SELECT * FROM reconcile_idea_votes_single('idea-uuid');
```

**Solutions:**
1. Si `was_fixed = true` → Désync corrigée, problème résolu
2. Si pas de votes trouvés → Vérifier RLS policies
3. Vérifier logs browser console pour erreurs JS

### Problème: Views Count ne s'incrémente pas

**Diagnostic:**
```sql
-- Vérifier que la fonction RPC existe
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'increment_idea_views';

-- Tester manuellement
SELECT increment_idea_views('idea-uuid');
SELECT views_count FROM ideas WHERE id = 'idea-uuid';
```

**Solutions:**
1. Appliquer migration `20251129_fix_idea_views_counter.sql`
2. Vérifier permissions GRANT EXECUTE
3. Vérifier logs Supabase pour erreurs RPC

### Problème: Rate Limit bloque à tort

**Diagnostic:**
```sql
SELECT * FROM get_user_vote_stats('user-uuid');
```

**Solutions:**
1. Si `votes_last_24h >= 50` → Rate limit correct
2. Si `votes_last_24h < 50` → Bug, vérifier fonction `check_vote_rate_limit()`
3. Nettoyer manuellement les vieux logs:
```sql
DELETE FROM idea_vote_log
WHERE user_id = 'user-uuid'
AND voted_at < now() - interval '24 hours';
```

---

## 📞 Support

**Logs Supabase:**
- Dashboard → Logs → Postgres Logs
- Filtrer par `idea_votes` ou `increment_idea_views`

**Logs Frontend:**
- Console Browser → Filtrer "vote" ou "idea"
- Network tab → Filtrer requêtes Supabase

**Contact Technique:**
- Issues GitHub du projet
- Documentation: `/docs/GALLERY_LIKES_IMPLEMENTATION.md` (référence similaire)

---

## ✅ Checklist de Déploiement

Avant de marquer la feature comme "Production Ready":

- [ ] Appliquer toutes les migrations SQL
- [ ] Tester vote/unvote sur plusieurs navigateurs
- [ ] Tester realtime entre 2 sessions différentes
- [ ] Vérifier `detect_vote_desync()` → doit être vide
- [ ] Configurer cron job de réconciliation
- [ ] Former l'équipe admin aux queries de monitoring
- [ ] Documenter dans wiki interne
- [ ] Tester rate limiting (50 votes en 24h)

---

**Dernière mise à jour:** 2025-11-29
**Version:** 1.0
**Migrations:** `20251129_*`
