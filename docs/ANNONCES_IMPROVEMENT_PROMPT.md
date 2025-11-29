# 🎯 Prompt Claude Code - Amélioration Module Annonces

**Date de création:** 2025-11-29
**Contexte:** Application PWA Sapeurs Pompiers Clermont
**Objectif:** Sécuriser et optimiser le système de favoris des petites annonces

---

## 📋 Contexte du Projet

Tu travailles sur une application PWA Next.js 15 pour les sapeurs-pompiers de Clermont-Ferrand.

**Stack Technique:**
- **Frontend:** Next.js 15 (App Router), React, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State:** React hooks, Server Actions
- **Styling:** shadcn/ui components

**Branche de travail:**
```bash
git checkout -b claude/improve-annonces-favorites-XXXXXX
```

---

## 🎯 Mission: Améliorer le Système de Favoris des Annonces

### Problèmes Actuels Identifiés

1. **❌ Sécurité:** Appels Supabase directs côté client
   - Expose la logique métier
   - Pas de validation serveur
   - Risque de manipulation

2. **❌ UX:** Pas d'Optimistic UI
   - L'utilisateur attend la réponse serveur
   - UX moins fluide que Gallery et Ideas

3. **❌ Pas de Realtime**
   - Les favoris ne se synchronisent pas entre onglets/devices

4. **❌ Incohérence Architecture**
   - Gallery: API Route
   - Ideas: Server Actions ✅ (moderne)
   - Annonces: Client direct ❌ (à corriger)

---

## ✅ Référence: Ce Qui a Été Fait Pour "Boîte à Idées"

Le module **Boîte à Idées** a été complètement optimisé et peut servir de modèle:

### Fichiers de Référence à Étudier

**Server Actions:**
```typescript
app/idees/actions.ts
// - voteIdeaAction() avec rate limiting
// - Retourne votesCount du serveur
// - Validation côté serveur
```

**Composant avec Optimistic UI:**
```typescript
components/idees/idea-vote-buttons.tsx
// - useState pour optimistic update
// - Rollback en cas d'erreur
// - Synchronisation avec props via useEffect
```

**Hook Realtime:**
```typescript
hooks/use-realtime-votes.ts
// - Subscription Supabase Realtime
// - Recount automatique sur changements
// - Cleanup lors du démontage
```

**Migrations SQL:**
```sql
supabase/migrations/20251129_fix_idea_vote_log_rls.sql
supabase/migrations/20251129_enable_realtime_idea_votes.sql
```

**Documentation:**
```markdown
docs/IDEAS_MONITORING_GUIDE.md
```

---

## 📁 État Actuel du Module Annonces

### Schéma Base de Données

**Migration:** `supabase/migrations/20241103_annonces_schema.sql`

```sql
-- Table principale
annonces (
  id uuid,
  user_id uuid,
  titre text,
  description text,
  prix decimal(10,2),
  categorie text,
  photos text[],
  localisation text,
  telephone text,
  statut text DEFAULT 'active',
  vues integer DEFAULT 0,
  favoris integer DEFAULT 0,  -- Compteur dénormalisé
  created_at timestamptz,
  updated_at timestamptz
)

-- Table de jonction (CORRECTE)
annonces_favoris (
  id uuid PRIMARY KEY,          -- ⚠️ Redondant (voir recommandations)
  user_id uuid REFERENCES auth.users(id),
  annonce_id uuid REFERENCES annonces(id),
  created_at timestamptz,
  UNIQUE(user_id, annonce_id)   -- ✅ Empêche doublons
)
```

**Trigger Existant:**
```sql
-- Fonction qui met à jour le compteur automatiquement
CREATE OR REPLACE FUNCTION update_annonce_favoris_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE annonces SET favoris = favoris + 1 WHERE id = NEW.annonce_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE annonces SET favoris = favoris - 1 WHERE id = OLD.annonce_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**RLS Policies:**
```sql
-- SELECT: Users voient leurs propres favoris
-- INSERT: Users peuvent ajouter favoris
-- DELETE: Users peuvent supprimer leurs favoris
```

### Code Frontend Actuel

**Page Détail Annonce:**
```typescript
app/(pwa)/annonces/[id]/page.tsx
// - Simple bouton cœur dans le header
// - Appel direct addToFavorites() / removeFromFavorites()
// - Pas d'optimistic UI
```

**Fonctions Client (PROBLÈME):**
```typescript
lib/supabase/annonces.ts

// ❌ Appels directs Supabase côté client
export async function addToFavorites(annonceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('annonces_favoris')
    .insert({ user_id: user.id, annonce_id: annonceId });

  if (error) throw error;
}

export async function removeFromFavorites(annonceId: string) {
  // Similaire
}

export async function isFavorited(annonceId: string) {
  // Check si dans favoris
}

export async function getMyFavorites() {
  // Liste des annonces favories de l'user
}
```

---

## 🎯 Objectifs à Implémenter

### 1. Créer Server Actions (Priorité 1 - Sécurité)

**Fichier à créer:** `app/annonces/actions.ts`

```typescript
"use server";

export async function toggleFavoriteAction(annonceId: string) {
  // 1. Vérifier auth
  // 2. Check si déjà favorisé
  // 3. INSERT ou DELETE
  // 4. Récupérer nouveau count depuis annonces.favoris
  // 5. revalidatePath()
  // 6. Retourner { success, isFavorited, favoritesCount }
}
```

**Inspiration:** Copier la logique de `app/idees/actions.ts:voteIdeaAction()`

### 2. Ajouter Optimistic UI (Priorité 1 - UX)

**Composant à créer:** `components/annonces/favorite-button.tsx`

Doit inclure:
- ✅ useState pour state local
- ✅ Optimistic update (cœur se remplit instantanément)
- ✅ Appel toggleFavoriteAction()
- ✅ Rollback si erreur
- ✅ Animation transition
- ✅ Loading state avec spinner

**Inspiration:** `components/idees/idea-vote-buttons.tsx`

### 3. Activer Realtime (Priorité 2 - Nice to Have)

**Migration SQL à créer:** `20251129_enable_realtime_annonces_favoris.sql`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE annonces_favoris;
```

**Hook à créer:** `hooks/use-realtime-favorites.ts`

**Inspiration:** `hooks/use-realtime-votes.ts`

### 4. Améliorer le Schéma DB (Priorité 3 - Optionnel)

**Migration à créer:** `20251129_improve_annonces_schema.sql`

```sql
-- Supprimer colonne id redondante
-- Utiliser PRIMARY KEY (user_id, annonce_id) comme Gallery
-- Ajouter index de performance si besoin
```

**Référence:** `supabase/migrations/20251106_gallery_likes_system.sql` (lignes 8-13)

---

## 📝 Plan d'Implémentation Recommandé

### Phase 1: Sécurité (30 min)

1. Créer `app/annonces/actions.ts` avec `toggleFavoriteAction()`
2. Migrer `lib/supabase/annonces.ts` vers server-side (garder pour RSC)
3. Tester que les favoris fonctionnent via Server Action

### Phase 2: UX (45 min)

4. Créer `components/annonces/favorite-button.tsx` avec optimistic UI
5. Intégrer dans `app/(pwa)/annonces/[id]/page.tsx`
6. Tester l'UX (clic → feedback instantané)

### Phase 3: Realtime (30 min)

7. Migration SQL pour activer realtime
8. Créer `hooks/use-realtime-favorites.ts`
9. Intégrer dans FavoriteButton
10. Tester entre 2 navigateurs

### Phase 4: Monitoring (optionnel, 30 min)

11. Créer fonctions de monitoring (si besoin)
12. Documentation

---

## 🔧 Commandes Utiles

### Développement
```bash
# Démarrer le dev server
npm run dev

# Vérifier TypeScript
npx tsc --noEmit

# Appliquer migrations
DATABASE_URL="xxx" npm run db:push
```

### Git
```bash
# Créer branche
git checkout -b claude/improve-annonces-favorites-XXXXXX

# Commits fréquents
git add .
git commit -m "feat: add server actions for annonces favorites"

# Push
git push -u origin claude/improve-annonces-favorites-XXXXXX
```

---

## 📊 Critères de Succès

À la fin de l'implémentation, vous devez pouvoir:

- [ ] ✅ Ajouter/retirer un favori via Server Action
- [ ] ✅ Voir le cœur se remplir instantanément (optimistic UI)
- [ ] ✅ Compteur favoris à jour
- [ ] ✅ Rollback automatique si erreur
- [ ] ✅ (Optionnel) Sync realtime entre onglets
- [ ] ✅ Pas d'appel Supabase direct côté client
- [ ] ✅ TypeScript compile sans erreur
- [ ] ✅ Tests manuels OK

---

## 🎓 Documentation de Référence

**Projet Actuel:**
- `docs/GALLERY_LIKES_IMPLEMENTATION.md` - Implémentation Gallery (référence)
- `docs/IDEAS_MONITORING_GUIDE.md` - Monitoring Ideas (référence)

**Next.js 15:**
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Optimistic Updates: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#optimistic-updates

**Supabase:**
- Realtime: https://supabase.com/docs/guides/realtime
- RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## 💡 Notes Importantes

### Différences Gallery vs. Ideas vs. Annonces

| Feature | Gallery | Ideas | Annonces (actuel) | Annonces (cible) |
|---------|---------|-------|-------------------|------------------|
| API | API Route | Server Action ✅ | Client direct ❌ | Server Action ✅ |
| Optimistic UI | ✅ | ✅ | ❌ | ✅ |
| Realtime | ✅ | ✅ | ❌ | ✅ |
| PK composite | ✅ | ❌ (id+unique) | ❌ (id+unique) | ⚠️ (optionnel) |
| Rate limiting | ❌ | ✅ (50/24h) | ❌ | ❌ (pas nécessaire) |
| Monitoring | Basique | ✅ Complet | ❌ | ⚠️ (optionnel) |

### Points d'Attention

1. **Ne pas casser l'existant:**
   - Garder les fonctions existantes pour compatibilité
   - Ajouter progressivement les nouvelles features

2. **Tester soigneusement:**
   - Multi-user (2 navigateurs)
   - Erreurs réseau (throttle Chrome DevTools)
   - Users non-authentifiés

3. **Performance:**
   - Éviter les requêtes inutiles
   - Utiliser revalidatePath() intelligemment
   - Cache Supabase si pertinent

---

## 🚀 Prompt de Démarrage

**Copier-coller ceci dans Claude Code:**

```
Bonjour Claude! Je travaille sur l'application PWA Sapeurs Pompiers Clermont (Next.js 15 + Supabase).

CONTEXTE:
Le module "Petites Annonces" permet aux pompiers de poster des annonces (vente/recherche d'objets). Les utilisateurs peuvent ajouter des annonces en favoris.

PROBLÈME ACTUEL:
- Les favoris utilisent des appels Supabase directs côté client (insécure)
- Pas d'Optimistic UI (UX moins fluide)
- Pas de Realtime sync

OBJECTIF:
Améliorer le système de favoris en s'inspirant du module "Boîte à Idées" qui a été récemment optimisé avec:
- Server Actions (sécurisé)
- Optimistic UI (UX fluide)
- Realtime sync (synchronisation live)

FICHIERS DE RÉFÉRENCE:
- app/idees/actions.ts (modèle Server Action)
- components/idees/idea-vote-buttons.tsx (modèle Optimistic UI)
- hooks/use-realtime-votes.ts (modèle Realtime)

FICHIERS À MODIFIER:
- Créer: app/annonces/actions.ts
- Créer: components/annonces/favorite-button.tsx
- Modifier: app/(pwa)/annonces/[id]/page.tsx
- Migration SQL pour realtime (optionnel)

PLAN:
1. Server Actions pour sécuriser
2. Optimistic UI pour UX
3. Realtime pour sync (optionnel)

Peux-tu commencer par analyser les fichiers actuels du module Annonces et me proposer un plan d'implémentation détaillé?

Fichiers clés:
- supabase/migrations/20241103_annonces_schema.sql
- lib/supabase/annonces.ts
- app/(pwa)/annonces/[id]/page.tsx
```

---

**Bonne chance! 🚀**

*Ce document a été généré automatiquement après l'optimisation du module Boîte à Idées.*
