# 🎯 Roadmap Boîte à Idées - Progression

**Dernière mise à jour:** 4 novembre 2025
**Durée totale:** 3 semaines (15 jours ouvrés)

---

## 📅 SEMAINE 1 : Backend + Feed + Création Texte

### ✅ JOUR 1-2 : Backend complet (TERMINÉ)

**Livrables :**
- ✅ Migration SQL : Tables ideas, idea_votes, idea_comments, idea_reports, idea_vote_log
- ✅ Row Level Security (RLS) configuré avec gestion rôles admin
- ✅ Bucket Storage `idea-audios` avec policies
- ✅ Types TypeScript : `lib/types/ideas.types.ts`
- ✅ Fonctions CRUD : `lib/supabase/ideas.ts`
- ✅ Système votes : `lib/supabase/idea-votes.ts`
- ✅ Commentaires : `lib/supabase/idea-comments.ts`
- ✅ Signalements : `lib/supabase/idea-reports.ts`
- ✅ Statistiques : `lib/supabase/idea-stats.ts`
- ✅ Documentation : `docs/IDEAS_BOX_BACKEND_SETUP.md`

**Optimisations implémentées :**
- Indexes sur toutes les colonnes critiques
- Dénormalisation counters (votes, comments)
- Triggers auto-update
- Rate limiting votes (50/24h)
- Soft delete

---

### 🔄 JOUR 3-4 : Feed + Création Texte (EN COURS)

**À créer :**
- [ ] Page Feed : `app/(pwa)/idees/page.tsx`
  - Liste idées avec pagination
  - Filtres par catégorie (chips)
  - Barre recherche
  - Tri : récent / populaire / trending
  - FAB "Nouvelle idée"

- [ ] Composants Feed :
  - [ ] `components/idees/idea-card.tsx` - Card dans le feed
  - [ ] `components/idees/idea-filters.tsx` - Filtres catégories
  - [ ] `components/idees/ideas-list.tsx` - Liste avec loading

- [ ] Page Création : `app/(pwa)/idees/nouvelle/page.tsx`
  - Formulaire : titre + description
  - Sélecteur catégories (multi-select)
  - Input tags (chips)
  - Toggle anonymat
  - Preview live
  - Actions : [Brouillon] [Publier]

- [ ] Composants Création :
  - [ ] `components/idees/idea-form.tsx` - Formulaire réutilisable
  - [ ] `components/idees/category-selector.tsx` - Multi-select catégories
  - [ ] `components/idees/tag-input.tsx` - Input chips tags
  - [ ] `components/idees/idea-preview.tsx` - Preview en live

**Priorités :**
1. Feed fonctionnel avec données mock
2. Création idée texte complète
3. Navigation fluide
4. Responsive mobile

---

### 🔄 JOUR 5 : Détail Idée + Votes (À VENIR)

**À créer :**
- [ ] Page Détail : `app/(pwa)/idees/[id]/page.tsx`
  - Affichage complet idée
  - Auteur (ou "Anonyme")
  - Boutons vote UP/DOWN
  - Section commentaires (preview)
  - Bouton partage
  - Actions admin

- [ ] Composants Votes :
  - [ ] `components/idees/idea-vote-buttons.tsx` - UP/DOWN avec état
  - [ ] `components/idees/vote-stats.tsx` - Stats votes

- [ ] Page Modification : `app/(pwa)/idees/[id]/modifier/page.tsx`
  - Réutilise IdeaForm
  - Load données existantes
  - Save changes

---

## 📅 SEMAINE 2 : Vocal IA + Commentaires

### 🔄 JOUR 6-8 : Enregistrement Vocal + API IA (À VENIR)

**À créer :**
- [ ] Composant VoiceRecorder : `components/idees/voice-recorder.tsx`
  - MediaRecorder API
  - Boutons Start/Stop
  - Timer (mm:ss)
  - Waveform animation (optionnel)
  - Export blob audio

- [ ] Page Enregistrer : `app/(pwa)/idees/enregistrer/page.tsx`
  - VoiceRecorder
  - Upload → Supabase Storage
  - Loading "Transcription..."
  - Affichage résultat IA
  - Édition possible
  - Actions : [Annuler] [Publier]

- [ ] API Transcription : `app/api/transcribe/route.ts`
  - Download audio depuis Supabase
  - Appel OpenAI Whisper
  - Return transcription

- [ ] API Analyse : `app/api/analyze-idea/route.ts`
  - Appel Claude Sonnet 4
  - Prompt structuré
  - Return JSON : titre, catégories, tags, modération

**Variables d'environnement à ajouter :**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Risques :**
- ⚠️ Formats audio navigateurs (prévoir fallback)
- ⚠️ Taille fichiers (limiter à 10MB)
- ⚠️ Coûts API (budget ~$20/mois estimé)

---

### 🔄 JOUR 9-10 : Commentaires + UI Polish (À VENIR)

**À créer :**
- [ ] Composant CommentSection : `components/idees/comment-section.tsx`
  - Liste commentaires
  - Formulaire ajout
  - Avatar + nom auteur
  - Date relative
  - Actions : Modifier / Supprimer (own)

- [ ] Server Actions commentaires : `app/actions/idea-comments.ts`
  - createCommentAction
  - updateCommentAction
  - deleteCommentAction

**UI/UX Polish :**
- [ ] Loading states partout
- [ ] Error handling (toast)
- [ ] Animations (framer-motion)
- [ ] Responsive mobile
- [ ] Accessibility (ARIA)

---

## 📅 SEMAINE 3 : Dashboard Admin + N8N + Finitions

### 🔄 JOUR 11-12 : Dashboard Admin (À VENIR)

**À créer :**
- [ ] Page Dashboard : `app/(pwa)/idees/dashboard/page.tsx`
  - Stats cards (total, ce mois, modération)
  - Top 5 idées
  - Chart catégories
  - Tags tendances
  - Export CSV

- [ ] Composants Dashboard :
  - [ ] `components/idees/idea-stats-cards.tsx`
  - [ ] `components/idees/ideas-chart.tsx`
  - [ ] `components/idees/trending-tags.tsx`

- [ ] Vue Modération : `app/(pwa)/idees/moderation/page.tsx`
  - Liste signalements pending
  - Actions : Approuver / Rejeter / Supprimer
  - Filtres status

---

### 🔄 JOUR 13-14 : N8N Workflows (À VENIR)

**Workflows à créer :**
- [ ] Process Voice Idea
  - Trigger : Webhook après upload audio
  - Transcription Whisper
  - Analyse Claude
  - Insert DB

- [ ] Auto Modération
  - Trigger : Schedule (hourly)
  - Fetch flagged ideas
  - Claude check approprié
  - Notify admin si inapproprié

**Note :** Peut être remplacé par API Routes directes si gain de temps nécessaire.

---

### 🔄 JOUR 15 : Tests + Déploiement (À VENIR)

**Tests :**
- [ ] E2E : Créer idée texte
- [ ] E2E : Créer idée vocale
- [ ] E2E : Voter + commenter
- [ ] E2E : Signaler idée
- [ ] E2E : Dashboard admin

**Déploiement :**
- [ ] Vérifier variables env production
- [ ] Appliquer migrations Supabase prod
- [ ] Deploy Vercel
- [ ] Test smoke production

---

## 📊 Métriques de progression

### Fonctionnalités
- ✅ Backend : 100%
- 🔄 Frontend Feed : 0%
- 🔄 Création Texte : 0%
- 🔄 Vocal + IA : 0%
- 🔄 Commentaires : 0%
- 🔄 Dashboard Admin : 0%

### Code
- **Fichiers créés :** 10/~35 (29%)
- **Lignes de code :** ~2000/~8000 (25%)
- **Tests :** 0/10

---

## 🎯 Prochaines actions immédiates

1. **Appliquer migrations Supabase** (CRITIQUE)
   ```bash
   # Dashboard Supabase → SQL Editor
   # Exécuter 20251104_ideas_box_schema.sql
   # Exécuter 20251104_ideas_storage_bucket.sql
   ```

2. **Tester backend**
   ```bash
   npx tsx scripts/test-ideas-backend.ts
   ```

3. **Commencer JOUR 3 : Feed**
   - Créer `app/(pwa)/idees/page.tsx`
   - Créer `components/idees/idea-card.tsx`
   - Mock data pour tester UI

---

## 💡 Optimisations suggérées

### Quick Wins
- [ ] SEO : generateMetadata() pour pages idées
- [ ] Analytics : Track events (idea_created, vote, etc.)
- [ ] PWA : Cache API responses
- [ ] Images : Optimiser avatars (next/image)

### Phase 2 (après MVP)
- [ ] Notifications push (nouvelle idée)
- [ ] Favoris (bookmark ideas)
- [ ] Partage externe (LinkedIn, Twitter)
- [ ] Export PDF idée
- [ ] Historique versions (édition)
- [ ] Badges gamification

---

**Contact technique :** GitHub Copilot
**Statut global :** 🟢 En cours (Backend terminé)
