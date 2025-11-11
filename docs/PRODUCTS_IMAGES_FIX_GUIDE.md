# Guide de résolution - Gestion Produits Boutique Landing Page

**Date:** 2025-11-11  
**Problèmes:** Images 400 Bad Request + Erreur upload

---

## 🐛 Problèmes identifiés

### 1. **Images retournent 400 Bad Request**

**Erreurs console:**
```
GET https://pompiers34800.com/_next/image?url=https%3A%2F%2Fnpyfregghvnmqxwgkfea.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Flanding_page%2Fporte_cles.png&w=1080&q=75 400 (Bad Request)
```

**Cause:** Le bucket Storage `landing_page` n'est **pas public** ou les policies RLS bloquent l'accès.

---

### 2. **Upload d'image échoue**

**Cause probable:** 
- Bucket `landing_page` n'existe pas
- Policies RLS bloquent l'upload
- User non authentifié ou pas role `admin`

---

## ✅ Solutions (étape par étape)

### Étape 1 : Vérifier le bucket Storage

**Dans Supabase Dashboard:**

1. Aller dans **Storage** (menu gauche)
2. Vérifier si bucket `landing_page` existe
3. Si NON → **Créer le bucket :**
   - Cliquer "New bucket"
   - Nom: `landing_page`
   - **Public: ✅ OUI (CRITICAL)** ⬅️ **C'EST LE PLUS IMPORTANT**
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
4. Si OUI → Vérifier que **Public = OUI**
   - Cliquer sur le bucket
   - Settings → Public access → **Activé**

---

### Étape 2 : Créer les policies RLS

**Exécuter la migration SQL:**

```sql
-- Dans Supabase SQL Editor, exécuter:
-- File: supabase/migrations/20251111_storage_landing_page_bucket.sql
```

Ou manuellement dans **Storage > landing_page > Policies:**

**Policy 1 - Lecture publique (CRITIQUE):**
```sql
CREATE POLICY "Public read access for landing_page"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'landing_page');
```

**Policy 2 - Upload authentifié:**
```sql
CREATE POLICY "Authenticated users can upload to landing_page"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'landing_page' 
  AND (storage.foldername(name))[1] IN ('products', 'logos_partenaires')
);
```

**Policy 3 - Update authentifié:**
```sql
CREATE POLICY "Authenticated users can update landing_page"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'landing_page')
WITH CHECK (bucket_id = 'landing_page');
```

**Policy 4 - Delete authentifié:**
```sql
CREATE POLICY "Authenticated users can delete landing_page"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'landing_page');
```

---

### Étape 3 : Tester l'accès public aux images

**Dans le navigateur, tester cette URL directement:**

```
https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png
```

**Résultat attendu:**
- ✅ **200 OK** → Image s'affiche
- ❌ **400 Bad Request** → Bucket pas public ou policy manquante
- ❌ **404 Not Found** → Fichier n'existe pas

**Si 400 ou 404:** Vérifier que:
1. Le bucket est **PUBLIC** (Settings > Public access)
2. La policy "Public read access" existe

---

### Étape 4 : Tester l'upload (user authentifié admin)

**Prérequis:**
- User connecté avec role `admin` dans table `profiles`
- Bucket `landing_page` existe et est public
- Policies RLS créées

**Test:**
1. Aller dans `/dashboard/admin/boutique`
2. Cliquer "Ajouter un produit"
3. Remplir le formulaire
4. Uploader une image (JPG/PNG/WEBP max 5MB)
5. Sauvegarder

**Si erreur:**
- Ouvrir la console navigateur (F12)
- Vérifier le message d'erreur détaillé
- Si "Bucket not found" → Créer le bucket
- Si "Policy violation" → Vérifier les policies RLS

---

### Étape 5 : Vérifier la structure du bucket

**Dans Supabase Storage > landing_page:**

Structure attendue:
```
landing_page/
├── products/           ← Images produits boutique
│   ├── 1699999999-abc123.jpg
│   ├── 1700000000-def456.png
│   └── ...
├── logos_partenaires/ ← Logos partenaires
│   ├── emporus_6cm_4cm.png
│   └── ...
├── porte_cles.png     ← Images legacy (racine)
├── calendrier_preview.png
├── tshirt.png
└── ...
```

**Important:** Les nouveaux uploads vont dans `products/`, mais les anciennes images sont à la racine.

---

## 🧪 Tests de validation

### Test 1 : Lecture publique

```bash
curl -I "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png"
```

**Résultat attendu:** `HTTP/2 200`

---

### Test 2 : Upload authentifié

**Avec Postman ou cURL:**

```bash
curl -X POST "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/landing_page/products/test.png" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: image/png" \
  --data-binary "@/path/to/image.png"
```

**Résultat attendu:** `201 Created` ou `200 OK`

---

### Test 3 : Vérifier policies SQL

```sql
-- Dans Supabase SQL Editor:
SELECT 
  policyname, 
  cmd,
  roles,
  qual::text AS using_clause,
  with_check::text
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%landing_page%'
ORDER BY policyname;
```

**Résultat attendu:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

## 🔧 Corrections appliquées dans le code

### 1. `app/actions/products/manage-product.ts`

**Ajouts:**
- ✅ Validation taille fichier (5MB max)
- ✅ Validation format (JPG/PNG/WEBP/GIF)
- ✅ `contentType` dans l'upload
- ✅ Message d'erreur détaillé avec mention bucket

**Avant:**
```typescript
if (error) {
  return { error: "Erreur lors de l'upload de l'image" }
}
```

**Après:**
```typescript
if (uploadError) {
  return { 
    error: `Erreur lors de l'upload: ${uploadError.message}. Vérifiez que le bucket 'landing_page' existe et est public.` 
  }
}
```

---

### 2. `supabase/migrations/20251111_storage_landing_page_bucket.sql`

Migration SQL créée avec:
- ✅ 4 policies RLS (SELECT public, INSERT/UPDATE/DELETE authenticated)
- ✅ Commentaires et vérifications
- ✅ Instructions pour créer le bucket manuellement

---

## 📊 Checklist de déploiement

**Avant de tester:**

- [ ] Bucket `landing_page` créé dans Supabase Dashboard
- [ ] Bucket configuré en **PUBLIC** (Settings > Public access)
- [ ] Migration SQL exécutée (policies RLS)
- [ ] User connecté avec role `admin`
- [ ] Image de test prête (JPG/PNG < 5MB)

**Tests:**

- [ ] URL publique fonctionne (200 OK)
- [ ] Upload depuis UI admin réussit
- [ ] Image s'affiche sur landing page
- [ ] Next.js Image Optimization fonctionne

---

## 🚨 Troubleshooting

### Erreur: "Bucket not found"
→ Créer le bucket `landing_page` dans Dashboard > Storage

### Erreur: "Policy violation"
→ Exécuter la migration SQL avec les policies RLS

### Images toujours 400
→ Vérifier que le bucket est **PUBLIC** (Settings)

### Upload échoue pour user non-admin
→ Vérifier role dans table `profiles`: `UPDATE profiles SET role = 'admin' WHERE id = 'user_id';`

### Images legacy (racine) ne s'affichent pas
→ Elles sont déjà uploadées, vérifier juste que bucket est public

---

## 📝 URLs à tester après fix

**Images produits legacy (racine):**
- `https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png`
- `https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/calendrier_preview.png`
- `https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/tshirt.png`

**Nouvelle image uploadée (après fix):**
- `https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/products/1699999999-abc123.jpg`

---

## ✅ Validation finale

**Après application des fixes:**

1. ✅ Bucket `landing_page` public créé
2. ✅ 4 policies RLS actives
3. ✅ Images legacy affichées (200 OK)
4. ✅ Upload nouveau produit réussit
5. ✅ Image affichée sur landing page
6. ✅ Next.js Image Optimization fonctionne

**Temps estimé:** 10-15 min

---

**Action immédiate prioritaire:**

🔴 **CRÉER LE BUCKET `landing_page` EN MODE PUBLIC** dans Supabase Dashboard > Storage
