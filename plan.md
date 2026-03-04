# Plan — Soldes antérieurs par équipe (Trésorier)

## Contexte technique

**Flux existant :**
- `getPotEquipeTournees()` dans `lib/supabase/compte.ts` calcule le pot d'équipe en sommant toutes les tournées complétées × 0.30
- Retourne `{ total_collecte, part_equipe, annee_campagne }`
- Utilisé dans `app/(pwa)/mon-compte/page.tsx` → affiche `part_equipe` comme "Total disponible"
- Table `pots_equipe` = soldes courants (pas historiques)
- **Aucune table `pots_equipe_historique` n'existe**

**Dashboard trésorier :**
- `app/(pwa)/tresorerie/page.tsx` : KPIs + tableau dépôts + liste versements
- Composants dans `components/tresorerie/`
- Accès restreint aux rôles `tresorier` et `admin`

---

## Étape 1 — Migration SQL

**Fichier :** `supabase/migrations/20260304_pots_equipe_historique.sql`

```sql
CREATE TABLE IF NOT EXISTS pots_equipe_historique (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id      uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  annee          integer NOT NULL,
  solde_anterieur numeric(10,2) DEFAULT 0 NOT NULL,
  notes          text,
  created_by     uuid REFERENCES profiles(id),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(equipe_id, annee)
);

ALTER TABLE pots_equipe_historique ENABLE ROW LEVEL SECURITY;

-- Tresorier/admin : accès complet
CREATE POLICY "tresorier_admin_all_historique" ON pots_equipe_historique
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tresorier', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tresorier', 'admin'))
  );

-- Membres : lecture seule pour leur propre équipe (affichage mon-compte)
CREATE POLICY "member_read_own_equipe_historique" ON pots_equipe_historique
  FOR SELECT TO authenticated
  USING (
    equipe_id IN (SELECT equipe_id FROM profiles WHERE id = auth.uid())
  );
```

**Décisions clés :**
- `UNIQUE(equipe_id, annee)` → réutilisable campagne 2026 et suivantes
- Double RLS : tresorier/admin en écriture, membres en lecture de leur équipe

---

## Étape 2 — Types TypeScript

**Fichier :** `lib/types/compte.ts` (ajout)

```typescript
export type PotEquipeHistorique = {
  id: string
  equipe_id: string
  annee: number
  solde_anterieur: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EquipePotSummary = {
  equipe_id: string
  equipe_nom: string
  part_equipe_campagne: number   // Calculé depuis les tournées
  annee_campagne: number
  solde_anterieur: number        // Depuis pots_equipe_historique
  total_disponible: number       // = part_equipe_campagne + solde_anterieur
  historique_id: string | null   // null si pas encore saisi
}
```

Re-export depuis `lib/types/index.ts`.

---

## Étape 3 — Fonctions de requête

### `lib/supabase/compte.ts` (ajout)

```typescript
// Récupère le solde antérieur d'une équipe pour une année
export async function getSoldeAnterieur(
  supabase: SupabaseClient,
  equipeId: string,
  annee: number
): Promise<number>
// Query: pots_equipe_historique WHERE equipe_id = ? AND annee = ?
// Retourne 0 si non trouvé
```

### `lib/supabase/tresorerie.ts` (ajout)

```typescript
// Récupère toutes les équipes actives avec pot campagne + solde antérieur
// Pour l'interface trésorier
export async function getEquipesPotSummary(
  supabase: SupabaseClient,
  annee: number
): Promise<EquipePotSummary[]>
// Queries:
// 1. equipes avec retribution_active = true
// 2. tournees completed par equipe → calcul part_equipe (× 0.30)
// 3. LEFT JOIN pots_equipe_historique sur equipe_id + annee
```

---

## Étape 4 — Server Action

**Fichier :** `app/actions/pot-historique.ts`

```typescript
"use server"

export async function upsertSoldeAnterieurAction(input: {
  equipeId: string
  annee: number
  solde: number
  notes?: string
}): Promise<{ success: boolean; error?: string }>
```

Logique :
1. Créer client Supabase serveur
2. Vérifier rôle (tresorier/admin) → erreur sinon
3. `upsert` dans `pots_equipe_historique` avec `onConflict: 'equipe_id,annee'`
4. `revalidatePath('/tresorerie')` + `revalidatePath('/mon-compte')`
5. Retourner `{ success: true }` ou `{ success: false, error: '...' }`

---

## Étape 5 — Composant UI trésorier

**Fichier :** `components/tresorerie/soldes-anterieurs-section.tsx`

Composant **Client** (`"use client"`), reçoit `EquipePotSummary[]` en prop.

Interface :
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Soldes antérieurs par équipe — Campagne 2025         │
├───────────────┬──────────────────┬──────────────────────┤
│ Équipe        │ Pot campagne 2025│ Solde antérieur      │
├───────────────┼──────────────────┼──────────────────────┤
│ Équipe Alpha  │ 420,00 €  (RO)  │ [____150,00 €____] 💾│
│ Équipe Bravo  │ 310,00 €  (RO)  │ [______0,00 €____] 💾│
│ Équipe Delta  │  90,00 €  (RO)  │ [____200,00 €____] 💾│
└───────────────┴──────────────────┴──────────────────────┘
```

- Sauvegarde **indépendante par ligne** (bouton 💾 par équipe)
- Toast Sonner en retour (succès/erreur)
- Input numérique, min=0, step=0.01
- shadcn/ui : Card, Table, Input, Button

---

## Étape 6 — Mise à jour page trésorier

**Fichier :** `app/(pwa)/tresorerie/page.tsx`

Ajouts :
1. Fetch `getEquipesPotSummary(supabase, new Date().getFullYear())` côté serveur
2. Rendre `<SoldesAnterieursSection>` après les sections existantes
3. Passer l'année et les données en props

---

## Étape 7 — Mise à jour page Mon Compte

**Fichier :** `app/(pwa)/mon-compte/page.tsx`

Ajouts :
1. Après `getPotEquipeTournees()`, appeler `getSoldeAnterieur(supabase, equipeId, annee_campagne)`
2. Calculer `total_disponible = part_equipe + solde_anterieur`
3. Mettre à jour la condition `afficherPotEquipe` : afficher la card si `part_equipe > 0 || solde_anterieur > 0`
4. Affichage dans la card :
   - Si `solde_anterieur > 0` : afficher le détail (2 lignes + total)
   - Si `solde_anterieur === 0` : affichage actuel inchangé (montant simple)

```
Cas avec solde antérieur :
┌─────────────────────────────────┐
│ 🏆 Pot d'équipe · Campagne 2025 │
│                                 │
│ Pot campagne    420,00 €        │
│ Solde antérieur 150,00 €        │
│ ─────────────────────────────── │
│ Total disponible  570,00 €      │
└─────────────────────────────────┘
```

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260304_pots_equipe_historique.sql` | Créer |
| `lib/types/compte.ts` | Modifier (ajout types) |
| `lib/types/index.ts` | Modifier (re-export) |
| `lib/supabase/compte.ts` | Modifier (ajout `getSoldeAnterieur`) |
| `lib/supabase/tresorerie.ts` | Modifier (ajout `getEquipesPotSummary`) |
| `app/actions/pot-historique.ts` | Créer |
| `components/tresorerie/soldes-anterieurs-section.tsx` | Créer |
| `app/(pwa)/tresorerie/page.tsx` | Modifier |
| `app/(pwa)/mon-compte/page.tsx` | Modifier |

**Total : 2 fichiers créés, 7 fichiers modifiés.**

---

## Ordre d'implémentation

1. Migration SQL
2. Types
3. Fonctions de requête
4. Server Action
5. Composant `SoldesAnterieursSection`
6. Page trésorier
7. Page mon-compte
