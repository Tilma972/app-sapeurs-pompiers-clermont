# Plan : Prise en compte des paiements par carte bleue dans le calcul des dépôts

## Problématique

**Scénario actuel problématique :**
- Un utilisateur collecte 300€ lors d'une tournée
- Dont 100€ payés par carte bleue (via Stripe) → déjà sécurisés
- Et 200€ en cash → à remettre physiquement au trésorier

**Comportement actuel (INCORRECT) :**
```
Montant à déposer = Total collecté - Total déjà déposé
                  = 300€ - 0€ 
                  = 300€ ❌ (alors qu'il n'a que 200€ en cash !)
```

**Comportement souhaité (CORRECT) :**
```
Montant à déposer = (Total collecté - Paiements CB validés) - Total déjà déposé
                  = (300€ - 100€) - 0€
                  = 200€ ✅
```

## État actuel du système

### ✅ Infrastructure existante

**Table `card_payments` déjà en place :**
```sql
CREATE TABLE card_payments (
  id UUID PRIMARY KEY,
  tournee_id UUID REFERENCES tournees(id),  -- Lien vers la tournée
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),                      -- Montant payé par CB
  status payment_status,                     -- 'pending' | 'succeeded' | 'failed'
  created_at TIMESTAMPTZ
);
```

**Fonction actuelle `get_montant_non_depose()` (SANS paiements CB) :**
```sql
CREATE FUNCTION get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
BEGIN
    -- Total collecté
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM tournees
    WHERE user_id = p_user_id AND statut = 'completed';

    -- Total déjà déposé
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM demandes_depot_fonds
    WHERE user_id = p_user_id AND statut = 'valide';

    RETURN GREATEST(v_total_collecte - v_total_depose, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Solution proposée

### 📝 Approche recommandée

**Mettre à jour la fonction `get_montant_non_depose()` pour déduire les paiements CB :**

```sql
CREATE OR REPLACE FUNCTION public.get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_cb DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
    v_cash_a_deposer DECIMAL(10,2);
BEGIN
    -- 1. Total collecté dans toutes les tournées completed
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut = 'completed';

    -- 2. Total des paiements CB validés (succeeded) pour les tournées de cet utilisateur
    SELECT COALESCE(SUM(cp.amount), 0)
    INTO v_total_cb
    FROM public.card_payments cp
    INNER JOIN public.tournees t ON t.id = cp.tournee_id
    WHERE t.user_id = p_user_id
    AND t.statut = 'completed'
    AND cp.status = 'succeeded';

    -- 3. Total déjà déposé (demandes validées)
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- 4. Cash restant à déposer = (Total collecté - CB validés) - Déjà déposé
    v_cash_a_deposer := v_total_collecte - v_total_cb - v_total_depose;

    -- Retourner 0 si négatif (cas où il y aurait eu trop de dépôts par erreur)
    RETURN GREATEST(v_cash_a_deposer, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 🔄 Migration SQL à créer

**Fichier :** `supabase/migrations/20251205_fix_montant_non_depose_with_cb.sql`

```sql
-- ============================================
-- Migration: Correction calcul montant non déposé avec paiements CB
-- Date: 2025-12-05
-- Description: Prend en compte les paiements par carte bleue dans le calcul
-- ============================================

CREATE OR REPLACE FUNCTION public.get_montant_non_depose(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_cb DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
    v_cash_a_deposer DECIMAL(10,2);
BEGIN
    -- 1. Total collecté dans toutes les tournées completed
    SELECT COALESCE(SUM(montant_collecte), 0)
    INTO v_total_collecte
    FROM public.tournees
    WHERE user_id = p_user_id
    AND statut = 'completed';

    -- 2. Total des paiements CB validés (succeeded) pour les tournées de cet utilisateur
    SELECT COALESCE(SUM(cp.amount), 0)
    INTO v_total_cb
    FROM public.card_payments cp
    INNER JOIN public.tournees t ON t.id = cp.tournee_id
    WHERE t.user_id = p_user_id
    AND t.statut = 'completed'
    AND cp.status = 'succeeded';

    -- 3. Total déjà déposé (demandes validées)
    SELECT COALESCE(SUM(montant_recu), 0)
    INTO v_total_depose
    FROM public.demandes_depot_fonds
    WHERE user_id = p_user_id
    AND statut = 'valide';

    -- 4. Cash restant à déposer = (Total collecté - CB validés) - Déjà déposé
    v_cash_a_deposer := v_total_collecte - v_total_cb - v_total_depose;

    -- Retourner 0 si négatif
    RETURN GREATEST(v_cash_a_deposer, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_montant_non_depose(UUID) IS 
'Calcule le montant cash non encore déposé pour un utilisateur.
Prend en compte : total collecté - paiements CB validés - dépôts cash validés';
```

## Impacts et bénéfices

### ✅ Avantages

1. **Calcul juste :** L'utilisateur ne sera plus sollicité pour déposer de l'argent qu'il n'a pas
2. **Transparence :** Distinction claire entre fonds sécurisés (CB) et cash à déposer
3. **Traçabilité :** Tout est tracé via les tables existantes
4. **Aucune modification UI :** La fonction SQL est utilisée partout, pas besoin de changer le code TypeScript

### 📊 Affichage amélioré (optionnel mais recommandé)

**Dans le dashboard utilisateur, on pourrait afficher :**

```
┌─────────────────────────────────────────┐
│ 💰 Fonds collectés                      │
├─────────────────────────────────────────┤
│ Total collecté :           300,00 €     │
│ Dont paiements CB :        100,00 €  ✓ │
│ Dont déjà déposé (cash) :    0,00 €  ✓ │
├─────────────────────────────────────────┤
│ 🏦 Cash à déposer :        200,00 €     │
└─────────────────────────────────────────┘
```

Cela nécessiterait de créer une fonction SQL complémentaire :

```sql
CREATE FUNCTION get_detail_fonds_utilisateur(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_collecte DECIMAL(10,2);
    v_total_cb DECIMAL(10,2);
    v_total_depose DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- [Mêmes calculs que get_montant_non_depose]
    
    v_result := json_build_object(
        'total_collecte', v_total_collecte,
        'total_cb_valide', v_total_cb,
        'total_cash_depose', v_total_depose,
        'cash_a_deposer', GREATEST(v_total_collecte - v_total_cb - v_total_depose, 0)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Plan d'implémentation

### Phase 1 : Migration SQL (PRIORITAIRE) ⭐

1. ✅ Créer le fichier de migration `20251205_fix_montant_non_depose_with_cb.sql`
2. ✅ Appliquer sur Supabase via SQL Editor
3. ✅ Tester avec des cas concrets :
   ```sql
   -- Test avec utilisateur ayant des paiements CB
   SELECT get_montant_non_depose('user-uuid-here');
   ```

### Phase 2 : Amélioration UI (OPTIONNEL)

1. Créer la fonction `get_detail_fonds_utilisateur()`
2. Créer un composant `DetailFondsCard` pour afficher le breakdown
3. Intégrer dans `/mon-compte/page.tsx`

### Phase 3 : Validation (RECOMMANDÉ)

1. Ajouter une validation lors de la création de demande de dépôt :
   ```typescript
   // Dans creerDemandeDepotAction()
   if (input.montant_a_deposer > montantNonDepose) {
     return {
       error: `Vous ne pouvez déposer que ${montantNonDepose}€ 
               (collecté: ${totalCollecte}€ - CB: ${totalCB}€ - déjà déposé: ${totalDepose}€)`
     }
   }
   ```

## Questions à clarifier

1. **Statut des paiements CB** : Faut-il attendre que le paiement soit `succeeded` ou compter aussi les `pending` ?
   - **Recommandation** : Uniquement `succeeded` (paiement confirmé par Stripe)

2. **Tournées annulées** : Les paiements CB des tournées annulées doivent-ils être comptés ?
   - **Recommandation** : NON, uniquement tournées `completed`

3. **Remboursements CB** : Si un paiement CB est remboursé, faut-il l'ajouter au cash à déposer ?
   - **Recommandation** : Oui, ajouter un champ `refunded_at` dans `card_payments` et l'exclure du calcul

## Estimation

- **Migration SQL** : 10 minutes (écriture + test)
- **Application sur Supabase** : 2 minutes
- **UI améliorée (optionnel)** : 1-2 heures
- **Tests complets** : 30 minutes

## Risques

- ⚠️ **Si `card_payments` a des données incohérentes** : Vérifier l'intégrité avant migration
- ⚠️ **Performance** : Le JOIN avec `card_payments` peut ralentir si beaucoup de données
  - **Mitigation** : Ajouter un index sur `(tournee_id, status)` si nécessaire

## Conclusion

Cette modification est **essentielle** pour la cohérence du système. Sans elle, les utilisateurs seraient bloqués ou forcés de "déposer" de l'argent qu'ils n'ont pas en cash.

**Action immédiate recommandée :** Créer et appliquer la migration SQL.
