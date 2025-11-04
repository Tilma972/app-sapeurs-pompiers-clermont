# 📦 Boîte à Idées - Backend Setup (JOUR 1-2)

## ✅ Fichiers créés

### 1. Migrations SQL
- `supabase/migrations/20251104_ideas_box_schema.sql` - Tables + RLS + Triggers
- `supabase/migrations/20251104_ideas_storage_bucket.sql` - Bucket Storage

### 2. Types TypeScript
- `lib/types/ideas.types.ts` - Interfaces et types

### 3. Fonctions Supabase
- `lib/supabase/ideas.ts` - CRUD idées
- `lib/supabase/idea-votes.ts` - Système de votes
- `lib/supabase/idea-comments.ts` - Gestion commentaires
- `lib/supabase/idea-reports.ts` - Signalements
- `lib/supabase/idea-stats.ts` - Statistiques admin

## 🚀 Prochaines étapes

### Exécuter les migrations

```bash
# Si vous utilisez Supabase CLI local
npx supabase migration up

# Ou dans Supabase Dashboard:
# 1. Aller dans SQL Editor
# 2. Copier/coller le contenu de 20251104_ideas_box_schema.sql
# 3. Exécuter
# 4. Répéter avec 20251104_ideas_storage_bucket.sql
```

### Regénérer les types TypeScript (optionnel)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

### Tester les fonctions

Créez un fichier de test ou utilisez les fonctions directement :

```typescript
import { getIdeas, createIdea } from '@/lib/supabase/ideas';

// Récupérer toutes les idées
const { ideas, total } = await getIdeas({ limit: 10 });

// Créer une idée
const newIdea = await createIdea({
  titre: 'Test idée',
  description: 'Description de test',
  categories: ['Équipement'],
  tags: ['test'],
});
```

## 📊 Structure des données

### Table `ideas`
- Contenu: titre, description, audio_url
- Catégorisation: categories[], tags[]
- Métriques: votes_count, comments_count, views_count
- Statut: draft, published, archived, flagged, deleted
- IA: ai_generated, ai_confidence_score

### Table `idea_votes`
- Relations: idea_id, user_id
- Type: up | down
- Contrainte: 1 vote par user par idée
- Rate limit: max 50 votes/24h

### Table `idea_comments`
- Relations: idea_id, user_id
- Contenu: content (max 2000 chars)
- Modération: is_flagged
- Soft delete: deleted_at

### Table `idea_reports`
- Signalements idées ou commentaires
- Raisons: spam, inappropriate, offensive, duplicate, other
- Statuts: pending, reviewed, dismissed, actioned

## 🔐 Sécurité RLS

### Ideas
- ✅ SELECT: Public (statut published) + Own + Admin
- ✅ INSERT: Users authentifiés
- ✅ UPDATE: Own + Admin
- ✅ DELETE: Admin only

### Votes
- ✅ SELECT: Public
- ✅ INSERT: Users (avec rate limit)
- ✅ UPDATE/DELETE: Own vote

### Comments
- ✅ SELECT: Public (non supprimés)
- ✅ INSERT: Users authentifiés
- ✅ UPDATE: Own + Admin
- ✅ DELETE: Admin only

## 🎯 Fonctionnalités implémentées

### CRUD Ideas ✅
- [x] getIdeas() - Avec filtres et pagination
- [x] getIdeaById() - Avec auteur et vote user
- [x] createIdea() - Validation incluse
- [x] updateIdea() - Vérification propriétaire
- [x] deleteIdea() - Soft delete
- [x] getUserIdeas() - Idées d'un user
- [x] getCategoriesStats() - Stats catégories
- [x] getPopularTags() - Tags tendances
- [x] searchIdeas() - Recherche full-text

### Votes ✅
- [x] voteIdea() - UP/DOWN avec toggle
- [x] getUserVote() - Vote user sur une idée
- [x] getIdeaVotes() - Tous les votes + stats
- [x] checkVoteRateLimit() - Vérif 50/24h
- [x] getUserVotedIdeas() - Historique votes user

### Commentaires ✅
- [x] getIdeaComments() - Avec auteurs
- [x] createComment() - Validation
- [x] updateComment() - Own only
- [x] deleteComment() - Soft delete
- [x] flagComment() - Signalement
- [x] getUserComments() - Historique user
- [x] getFlaggedComments() - Modération admin

### Signalements ✅
- [x] reportIdea() - Signaler idée
- [x] reportComment() - Signaler commentaire
- [x] getAllReports() - Liste admin
- [x] updateReportStatus() - Traiter signalement
- [x] getModerationStats() - Stats modération

### Stats & Analytics ✅
- [x] getIdeasDashboardStats() - Dashboard complet
- [x] getEngagementStats() - Métriques engagement
- [x] getTopContributors() - Leaderboard créateurs
- [x] exportIdeasToCSV() - Export données
- [x] getIdeasTimeline() - Évolution temporelle
- [x] getCategoryStats() - Stats par catégorie

## 🧪 À tester

1. **Créer une idée** → Vérifier insertion + RLS
2. **Voter** → Tester toggle + rate limit
3. **Commenter** → Vérifier soft delete
4. **Signaler** → Tester auto-flag à 3 reports
5. **Stats** → Vérifier calculs métriques

## 📝 Notes techniques

### Optimisations implémentées
- ✅ Indexes sur toutes les colonnes de recherche/tri
- ✅ Dénormalisation des counters (votes_count, comments_count)
- ✅ Triggers auto-update des métriques
- ✅ Pagination avec range()
- ✅ Soft delete au lieu de hard delete

### Fonctions PostgreSQL créées
- `recalculate_idea_votes_count()`
- `recalculate_idea_comments_count()`
- `check_vote_rate_limit()`
- `update_ideas_updated_at()` (trigger)

### À venir (JOUR 3+)
- [ ] Pages Next.js
- [ ] Composants UI
- [ ] APIs transcription (Whisper)
- [ ] APIs analyse IA (Claude)

---

**Status:** ✅ Backend complet - Prêt pour le frontend
**Durée:** 2 jours
**Prochaine étape:** JOUR 3-4 - Feed + Création texte
