# 🔧 Fix : Erreur Upload Audio Idées Vocales

## 🐛 Problème Identifié

### Symptômes
- Erreur lors de la validation d'un enregistrement vocal
- Message d'erreur lié aux règles RLS du storage
- Upload échoue avec erreur de permission

### Cause Racine
**Incompatibilité entre le format de chemin d'upload et les règles RLS**

**Code original (❌ Incorrect)** :
```typescript
const filename = `${user.id}_${timestamp}.webm`;
// Résultat : a1b2c3d4-e5f6-7890-abcd-ef1234567890_1699564800000.webm
```

**Policy RLS attendait (✅ Correct)** :
```sql
(storage.foldername(name))[1] = auth.uid()::text
-- Attend un dossier : user_id/filename.webm
```

## ✅ Solution Appliquée

### Modification du Code d'Upload

**Fichier** : `app/(pwa)/idees/enregistrer/page.tsx`

**Avant** :
```typescript
const timestamp = Date.now();
const filename = `${user.id}_${timestamp}.webm`;
```

**Après** :
```typescript
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(2, 15);
const filename = `${user.id}/${timestamp}_${randomId}.webm`;
```

### Format Correct
```
idea-audios/
  └── {user_id}/
      ├── 1699564800000_abc123.webm
      ├── 1699564900000_def456.webm
      └── 1699565000000_ghi789.webm
```

## 🔐 Règles RLS Storage

Les policies RLS sur `storage.objects` vérifient :

### 1. INSERT Policy
```sql
CREATE POLICY "idea_audios_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'idea-audios'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Explication** :
- ✅ Bucket doit être `idea-audios`
- ✅ User authentifié requis
- ✅ Premier dossier = user_id de l'utilisateur connecté

### 2. SELECT Policy (Public)
```sql
CREATE POLICY "idea_audios_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'idea-audios');
```
- 📖 Tous les audios sont publics (idées publiées)

### 3. UPDATE/DELETE Policies
- ✅ Users : Peuvent modifier/supprimer leurs propres fichiers
- ✅ Admins : Peuvent tout supprimer

## 🧪 Tests

### Test 1 : Vérifier les Policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%idea_audios%';
```

### Test 2 : Vérifier les Fichiers
```sql
SELECT name, owner, created_at
FROM storage.objects 
WHERE bucket_id = 'idea-audios'
ORDER BY created_at DESC;
```

### Test 3 : Test de Path
```sql
SELECT 
  name,
  (storage.foldername(name))[1] as user_folder
FROM storage.objects 
WHERE bucket_id = 'idea-audios';
```

## 📝 Checklist de Vérification

- [x] Code d'upload modifié avec format dossier
- [x] Gestion d'erreur améliorée (console.error)
- [x] ID aléatoire ajouté pour éviter collisions
- [ ] Tester upload depuis l'interface
- [ ] Vérifier que l'URL publique fonctionne
- [ ] Vérifier que la transcription fonctionne avec nouvelle URL
- [ ] Tester avec plusieurs utilisateurs

## 🚀 Déploiement

### Étapes
1. ✅ Code corrigé dans `app/(pwa)/idees/enregistrer/page.tsx`
2. ⏳ Build et deploy
3. ⏳ Test en production
4. ⏳ Monitorer les erreurs via logs

### Points d'Attention
- Les anciens fichiers (format flat) ne seront pas affectés
- Seuls les nouveaux uploads utiliseront le format avec dossier
- Nettoyage possible des anciens fichiers orphelins

## 📊 Monitoring

### Logs à Surveiller
```typescript
console.error("Upload error:", error);
// → Erreur détaillée avec message Supabase
```

### Métriques
- Taux de succès d'upload
- Temps moyen d'upload
- Taux d'erreur RLS vs autres erreurs

## 🔗 Références

- Migration Storage : `supabase/migrations/20251104_ideas_storage_bucket.sql`
- Tests SQL : `supabase/migrations/TEST_idea_audios_storage.sql`
- Documentation Supabase Storage : https://supabase.com/docs/guides/storage
- Storage RLS : https://supabase.com/docs/guides/storage/security/access-control
