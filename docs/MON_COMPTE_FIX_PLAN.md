# Plan d'action : Correction de la page Mon Compte

## 🐛 Problèmes identifiés

### 1. **Erreur principale** : `Failed to fetch equipe with settings from profile`

**Cause racine :** 
```typescript
// Dans getEquipeWithSettingsFromProfile()
.select('team_id, equipes(id, nom, mode_transparence, ...)')
```

**Problème :** La relation `profiles.team_id → equipes` peut être:
- ❌ `NULL` (utilisateur sans équipe)
- ❌ Inexistante (FK mal configurée)
- ❌ Bloquée par RLS sur table `equipes`

**Résultat :** L'erreur est levée même si l'utilisateur n'a pas d'équipe (cas légitime).

---

### 2. **Appel non protégé à `getPotEquipe()`**

**Code actuel :**
```typescript
const potEquipe = teamId ? await getPotEquipe(supabase, teamId) : null;
```

**Problème :** 
- Si `teamId = NULL` → OK, skip
- Mais si `teamId` existe et que la table `pots_equipe` n'a pas de ligne → crash
- Ou si RLS bloque l'accès → crash

---

### 3. **Logique de fetch incohérente**

**Problème :**
```typescript
// Ligne 22: Appel à getEquipeWithSettingsFromProfile (PEUT FAIL)
const eqWithSettings = await getEquipeWithSettingsFromProfile(supabase, user.id);

// Ligne 29-33: Re-fetch profile.team_id (DOUBLON)
const { data: profile } = await supabase
  .from('profiles')
  .select('team_id')
  .eq('id', user.id)
  .single();
```

**Incohérence :** On fetch 2 fois les infos du profil/équipe au lieu de réutiliser `eqWithSettings`.

---

### 4. **Gestion d'erreur silencieuse**

**Problème :**
```typescript
// getEquipeWithSettingsFromProfile() retourne null en cas d'erreur
return null; // ❌ Masque le vrai problème
```

**Impact :** L'utilisateur ne sait pas si:
- Il n'a pas d'équipe (normal)
- Il y a une erreur technique (anormal)

---

## ✅ Solutions proposées

### Solution 1️⃣ : **Refactoriser `getEquipeWithSettingsFromProfile()`**

**Objectif :** Distinguer "pas d'équipe" vs "erreur technique".

```typescript
export async function getEquipeWithSettingsFromProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<EquipeWithSettings | null> {
  try {
    // D'abord, récupérer le team_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new DatabaseError('Failed to fetch profile team_id', profileError);
    }

    // Si pas d'équipe, retourner null (cas légitime)
    if (!profile?.team_id) {
      return null;
    }

    // Ensuite, fetch les détails de l'équipe
    const { data: equipe, error: equipeError } = await supabase
      .from('equipes')
      .select('id, nom, mode_transparence, pourcentage_minimum_pot, pourcentage_recommande_pot')
      .eq('id', profile.team_id)
      .single();

    if (equipeError) {
      // Si erreur RLS ou FK invalide → log mais ne crash pas
      logError(new DatabaseError('Failed to fetch equipe details', equipeError), {
        component: 'getEquipeWithSettingsFromProfile',
        action: 'fetch_equipe',
        userId,
        teamId: profile.team_id,
      });
      return null;
    }

    return equipe as EquipeWithSettings;
  } catch (error) {
    logError(error, {
      component: 'getEquipeWithSettingsFromProfile',
      action: 'fetch',
      userId,
    });
    return null;
  }
}
```

**Avantages :**
- ✅ Gère explicitement le cas `team_id = NULL`
- ✅ Pas de JOIN PostgreSQL complexe (plus fiable)
- ✅ Logs détaillés pour debug

---

### Solution 2️⃣ : **Protéger l'appel à `getPotEquipe()`**

**Objectif :** Ne pas crasher si le pot n'existe pas.

```typescript
export async function getPotEquipe(
  supabase: SupabaseClient,
  equipeId: string
): Promise<PotEquipe | null> {
  try {
    const { data, error } = await supabase
      .from('pots_equipe')
      .select('solde_disponible')
      .eq('equipe_id', equipeId)
      .maybeSingle(); // ⬅️ CHANGEMENT : maybeSingle au lieu de single

    if (error) {
      throw new DatabaseError('Failed to fetch pot equipe', error);
    }

    // Si pas de pot (équipe sans pot initialisé), retourner null
    return data ? (data as PotEquipe) : null;
  } catch (error) {
    logError(error, {
      component: 'getPotEquipe',
      action: 'fetch',
      metadata: { equipeId },
    });
    return null;
  }
}
```

**Changement clé :** `.maybeSingle()` au lieu de `.single()` → ne lève pas d'erreur si 0 résultat.

---

### Solution 3️⃣ : **Simplifier la page `mon-compte`**

**Objectif :** Utiliser une seule source de vérité pour l'équipe.

```typescript
export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Récupération parallèle des données
  const [compte, eqWithSettings, mouvements] = await Promise.all([
    getUserCompte(supabase, user.id),
    getEquipeWithSettingsFromProfile(supabase, user.id), // ⬅️ Retourne null si pas d'équipe
    getMouvementsRetribution(supabase, user.id, PAGINATION_CONFIG.MOUVEMENTS_RETRIBUTION_LIMIT),
  ]);

  // 2. Récupérer le pot d'équipe SEULEMENT si équipe existe
  const potEquipe = eqWithSettings?.id 
    ? await getPotEquipe(supabase, eqWithSettings.id) 
    : null;

  // 3. Utiliser la config recommandée (avec fallback)
  const recommandationEquipe = eqWithSettings?.pourcentage_recommande_pot 
    ?? RETRIBUTION_CONFIG.RECOMMANDE_POT_EQUIPE_DEFAULT;

  return (
    <PwaContainer>
      {/* UI inchangée */}
    </PwaContainer>
  );
}
```

**Avantages :**
- ✅ 1 seul fetch pour profile + équipe
- ✅ Pas de doublon de requêtes
- ✅ Logique plus claire

---

### Solution 4️⃣ : **Afficher un état "Sans équipe"**

**Objectif :** UX transparente pour l'utilisateur.

```tsx
{/* Alerte si pas d'équipe */}
{!eqWithSettings && (
  <Alert>
    <AlertTitle>Pas encore d'équipe</AlertTitle>
    <AlertDescription>
      Vous n'êtes rattaché à aucune équipe. Contactez un administrateur pour rejoindre une équipe.
    </AlertDescription>
  </Alert>
)}

{/* Pot d'équipe (seulement si équipe + pot existent) */}
{eqWithSettings && potEquipe && (
  <details className="rounded-lg border bg-card">
    {/* ... */}
  </details>
)}
```

---

## 📋 Checklist d'implémentation

### Étape 1 : **Corriger `getEquipeWithSettingsFromProfile()`**
- [ ] Séparer fetch `profile.team_id` et fetch `equipes`
- [ ] Gérer explicitement `team_id = NULL`
- [ ] Ajouter logs détaillés

### Étape 2 : **Corriger `getPotEquipe()`**
- [ ] Remplacer `.single()` par `.maybeSingle()`
- [ ] Gérer le cas "pot non initialisé"

### Étape 3 : **Simplifier `mon-compte/page.tsx`**
- [ ] Supprimer le re-fetch de `profile.team_id`
- [ ] Utiliser `eqWithSettings.id` pour fetch pot
- [ ] Ajouter alerte "Pas d'équipe"

### Étape 4 : **Vérifier RLS et FK**
- [ ] Table `equipes` : RLS permet lecture pour membres
- [ ] Table `pots_equipe` : RLS permet lecture pour membres équipe
- [ ] FK `profiles.team_id → equipes.id` : ON DELETE SET NULL

### Étape 5 : **Tests manuels**
- [ ] User avec équipe + pot → affiche tout
- [ ] User avec équipe mais sans pot → affiche équipe, pas de pot
- [ ] User sans équipe → affiche alerte, pas de crash
- [ ] User avec team_id invalide (FK cassée) → log erreur, pas de crash

---

## 🔍 Diagnostic complémentaire : RLS et FK

### Vérifier RLS sur `equipes`:

```sql
-- Voir les policies RLS sur table equipes
SELECT * FROM pg_policies WHERE tablename = 'equipes';

-- Policy attendue:
CREATE POLICY "Users can read their own equipe"
ON equipes FOR SELECT
USING (
  id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);
```

### Vérifier FK `profiles.team_id`:

```sql
-- Voir la contrainte FK
SELECT 
  conname AS constraint_name,
  confdeltype AS on_delete_action
FROM pg_constraint 
WHERE conname LIKE '%team_id%';

-- Action attendue: ON DELETE SET NULL (code 'n')
-- Si ON DELETE CASCADE (code 'c') → problématique
```

### Vérifier RLS sur `pots_equipe`:

```sql
-- Policy attendue:
CREATE POLICY "Users can read pot of their equipe"
ON pots_equipe FOR SELECT
USING (
  equipe_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
);
```

---

## 🚀 Ordre d'exécution recommandé

1. **Immédiat :** Corriger `getPotEquipe()` (`.maybeSingle()`) → 2 min
2. **Court terme :** Refactoriser `getEquipeWithSettingsFromProfile()` → 10 min
3. **Court terme :** Simplifier `mon-compte/page.tsx` → 5 min
4. **Moyen terme :** Vérifier RLS/FK en DB → 15 min
5. **Validation :** Tests manuels avec différents profils → 10 min

**Temps total estimé : ~45 min**

---

## 📊 Résumé des erreurs vs solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Failed to fetch equipe with settings` | JOIN PostgreSQL échoue si `team_id = NULL` | Séparer fetch profile + équipe |
| Crash sur `getPotEquipe()` | `.single()` lève erreur si 0 résultat | Utiliser `.maybeSingle()` |
| Doublons de fetch | `getEquipeWithSettingsFromProfile()` + re-fetch `team_id` | Réutiliser `eqWithSettings.id` |
| UX opaque | Erreur silencieuse | Afficher alerte "Pas d'équipe" |

---

## ✅ Validation finale

Après implémentation, tester avec ces profils:

1. **Profil A** : Équipe + Pot initialisé → ✅ Affiche tout
2. **Profil B** : Équipe + Pot vide → ✅ Affiche équipe, pas de pot
3. **Profil C** : `team_id = NULL` → ✅ Alerte "Pas d'équipe"
4. **Profil D** : `team_id` invalide (FK cassée) → ✅ Log erreur, alerte "Pas d'équipe"

---

**Prêt à implémenter ? Je commence par quelle étape ?** 🚀
