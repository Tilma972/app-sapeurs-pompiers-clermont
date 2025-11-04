# 🚀 Module Avantages - Jour 1 : Migration Base de Données

## ✅ Checklist Jour 1

- [ ] Exécuter migration tables
- [ ] Exécuter migration storage
- [ ] Vérifier les données seed
- [ ] Tester les policies RLS
- [ ] Régénérer les types TypeScript

---

## 📋 Instructions Étape par Étape

### **Étape 1 : Exécuter la migration principale**

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu de `supabase/migrations/20241104_avantages_module.sql`
3. Cliquer sur **Run**
4. ✅ Vérifier le message : `Migration terminée avec succès !`

**Attendu :**
```
✅ Migration terminée avec succès !
   - 3 partenaires créés
   - 3 offres créées
```

---

### **Étape 2 : Configurer le Storage**

1. Toujours dans **SQL Editor**
2. Copier le contenu de `supabase/migrations/20241104_avantages_storage.sql`
3. Cliquer sur **Run**
4. ✅ Vérifier le message : `Storage configuré avec succès !`

**Vérification manuelle :**
- Aller dans **Storage** → Vérifier que `partner-logos` et `offer-images` existent

---

### **Étape 3 : Vérifier les données**

Exécuter dans SQL Editor :

```sql
-- Compter les partenaires
SELECT COUNT(*) as total_partners FROM partners;
-- Attendu: 3

-- Lister les partenaires
SELECT nom, categorie, ville, actif, featured 
FROM partners 
ORDER BY ordre;

-- Compter les offres
SELECT COUNT(*) as total_offers FROM partner_offers;
-- Attendu: 3

-- Lister les offres avec partenaire
SELECT 
  p.nom as partenaire,
  o.titre,
  o.type_avantage,
  o.valeur,
  o.actif,
  o.featured
FROM partner_offers o
JOIN partners p ON p.id = o.partner_id
ORDER BY o.ordre;
```

**Résultat attendu :**
| partenaire | titre | type_avantage | valeur | actif | featured |
|-----------|-------|---------------|--------|-------|----------|
| Restaurant La Forge | 20% sur toute l'addition | qr_local | 20% | true | true |
| Garage AutoPro | Vidange gratuite... | code_promo | Offert | true | false |
| Sport 2000 Clermont | 15% de réduction... | code_promo | 15% | true | false |

---

### **Étape 4 : Tester les RLS Policies**

```sql
-- Test 1: Lecture publique (devrait marcher)
SET request.jwt.claims = '{}';
SELECT COUNT(*) FROM partners WHERE actif = true;
-- Attendu: 3

-- Test 2: Lecture offres publiques
SELECT COUNT(*) FROM partner_offers WHERE actif = true;
-- Attendu: 3

-- Test 3: Admin peut tout voir
-- (Remplacer YOUR_ADMIN_UUID par un vrai UUID admin)
SET request.jwt.claims = '{"sub": "YOUR_ADMIN_UUID"}';
SELECT COUNT(*) FROM partners;
-- Attendu: 3
```

---

### **Étape 5 : Régénérer les types TypeScript**

```bash
# Dans le terminal du projet
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

**Alternative (si lié à Supabase CLI) :**
```bash
supabase gen types typescript --linked > lib/database.types.ts
```

---

## ✅ Critères de Succès Jour 1

- [x] 3 tables créées (`partners`, `partner_offers`, `offer_usage`)
- [x] Indexes créés (8 indexes)
- [x] RLS activée sur les 3 tables
- [x] 6 policies créées
- [x] 2 buckets storage créés
- [x] 8 storage policies créées
- [x] 3 partenaires seed insérés
- [x] 3 offres seed insérées
- [x] Triggers `updated_at` fonctionnels

---

## 🐛 Troubleshooting

### Erreur : "relation profiles does not exist"
**Cause :** La table `profiles` n'existe pas encore dans ta base.

**Solution :**
```sql
-- Créer une table profiles minimale (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'membre',
  created_at timestamptz DEFAULT now()
);
```

### Erreur : "bucket already exists"
**Cause :** Les buckets existent déjà.

**Solution :** C'est normal, le script gère ça avec `ON CONFLICT DO NOTHING`. Continuer.

### Erreur : "policy already exists"
**Cause :** Tu as déjà run le script.

**Solution :** Le script utilise `DROP POLICY IF EXISTS` pour réinitialiser. Tout va bien.

---

## 📊 Vérification Finale

Exécuter cette requête de santé complète :

```sql
-- Health Check Complet
WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM partners) as partners_count,
    (SELECT COUNT(*) FROM partner_offers) as offers_count,
    (SELECT COUNT(*) FROM partners WHERE featured = true) as featured_partners,
    (SELECT COUNT(*) FROM partner_offers WHERE featured = true) as featured_offers,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('partners', 'partner_offers', 'offer_usage')) as policies_count
)
SELECT 
  partners_count,
  offers_count,
  featured_partners,
  featured_offers,
  policies_count,
  CASE 
    WHEN partners_count >= 3 AND offers_count >= 3 AND policies_count >= 6 
    THEN '✅ Jour 1 VALIDÉ'
    ELSE '❌ Jour 1 INCOMPLET'
  END as status
FROM stats;
```

**Résultat attendu :**
```
partners_count: 3
offers_count: 3
featured_partners: 1
featured_offers: 1
policies_count: 9
status: ✅ Jour 1 VALIDÉ
```

---

## 🎯 Prochaines Étapes (Jour 2)

Une fois Jour 1 validé :
1. ✅ Créer les fonctions Supabase (`lib/supabase/partners.ts`, `lib/supabase/offers.ts`)
2. ✅ Créer les types TypeScript
3. ✅ Tester les queries

**Ready ? Exécute les migrations et confirme-moi quand c'est fait ! 🚀**
