# Correction du système d'avatars - Format de stockage

## 🐛 Problème identifié

**Symptôme:** La colonne `profiles.avatar_url` (type TEXT) recevait des valeurs incohérentes :
- ❌ UUID aléatoires au lieu de chemins de fichiers
- ❌ URLs complètes (`https://xxx.supabase.co/storage/v1/object/public/avatars/...`)
- ❌ Mélange de formats rendant l'affichage imprévisible

**Cause:** Le composant `AvatarUpload` stockait parfois l'URL publique au lieu du chemin relatif, et reconstruisait mal l'URL lors de l'affichage.

---

## ✅ Solution implémentée

### Format standardisé pour `profiles.avatar_url`:

**Valeur stockée en DB:** Chemin relatif Storage
```
userId/avatar.ext
```

**Exemples:**
```
abc123-def456-ghi789/avatar.jpg
def456-ghi789-jkl012/avatar.png
```

**Valeur affichée (URL complète):** Construite dynamiquement
```
https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/avatars/userId/avatar.ext
```

---

## 📁 Fichiers modifiés

### 1. **Helpers utilitaires** - `lib/utils/avatar.ts` ✅ CRÉÉ

Fonctions créées:

- `getAvatarUrl(avatarPath)`: Construit l'URL complète depuis le chemin relatif
- `generateAvatarPath(userId, ext)`: Génère le chemin standardisé `userId/avatar.ext`
- `getFileExtension(filename)`: Extrait l'extension du fichier
- `validateAvatarFile(file)`: Valide taille (2MB) et format (JPG/PNG/WEBP)

**Avantages:**
- ✅ Logique centralisée
- ✅ Réutilisable dans toute l'app
- ✅ Tests unitaires possibles
- ✅ Changement de stratégie facile (ex: CDN externe)

---

### 2. **Composant upload** - `components/profile/avatar-upload.tsx` ✅ REFACTORISÉ

**Avant:**
```tsx
const fileExt = file.name.split('.').pop()
const fileName = `${userId}/avatar.${fileExt}`
// ...
update({ avatar_url: fileName })
// Mais ensuite:
setAvatarUrl(publicUrl) // ❌ Incohérence
```

**Après:**
```tsx
const fileExt = getFileExtension(file.name)
const filePath = generateAvatarPath(userId, fileExt)
// ...
update({ avatar_url: filePath })
setAvatarUrl(filePath) // ✅ Cohérent

// Affichage:
const displayUrl = previewUrl || getAvatarUrl(avatarUrl)
```

**Changements:**
1. Validation avec `validateAvatarFile()`
2. Génération de chemin avec `generateAvatarPath()`
3. Stockage du chemin relatif (pas URL)
4. Reconstruction URL avec `getAvatarUrl()`
5. Suppression: utilise directement `avatarUrl` (déjà le bon chemin)

---

### 3. **Layout PWA** - `app/(pwa)/layout.tsx` ✅ REFACTORISÉ

**Avant:**
```tsx
avatar_url: profile?.avatar_url || undefined
// Passait directement le chemin relatif au composant Avatar ❌
```

**Après:**
```tsx
const avatarUrl = getAvatarUrl(profile?.avatar_url)
// ...
avatar_url: avatarUrl || undefined
// Passe l'URL complète au composant Avatar ✅
```

---

### 4. **Migration de nettoyage** - `supabase/migrations/20251111_fix_avatar_url_format.sql` ✅ CRÉÉ

**Actions:**

1. **Supprimer les UUID invalides**
   ```sql
   UPDATE profiles SET avatar_url = NULL
   WHERE avatar_url ~ '^[0-9a-f]{8}-[0-9a-f]{4}-...$';
   ```

2. **Extraire chemins relatifs depuis URLs complètes**
   ```sql
   UPDATE profiles SET avatar_url = 
     regexp_replace(avatar_url, '^.*/storage/v1/object/public/avatars/', '')
   WHERE avatar_url LIKE 'http%';
   ```

3. **Supprimer formats invalides** (pas de slash, pas d'URL)
   ```sql
   UPDATE profiles SET avatar_url = NULL
   WHERE avatar_url NOT LIKE '%/%' AND avatar_url NOT LIKE 'http%';
   ```

4. **Logs de vérification**
   - Total profils
   - Profils avec avatar restants

---

## 🔧 Migration SQL initiale - Rappel

**Fichier:** `supabase/migrations/20251111_add_avatar_support.sql`

```sql
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;

CREATE OR REPLACE FUNCTION get_avatar_url(p profiles)
RETURNS TEXT AS $$
BEGIN
  IF p.avatar_url LIKE 'http%' THEN
    RETURN p.avatar_url;
  ELSE
    RETURN current_setting('app.supabase_url') || '/storage/v1/object/public/avatars/' || p.avatar_url;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Note:** La fonction SQL `get_avatar_url()` existe mais n'est pas utilisée côté TypeScript (on utilise le helper `lib/utils/avatar.ts` à la place).

---

## 🧪 Tests recommandés

### 1. Upload d'avatar

```tsx
// User: abc123-def456-ghi789
// Upload: photo.jpg

// Vérifier en DB:
SELECT avatar_url FROM profiles WHERE id = 'abc123-def456-ghi789';
-- Résultat attendu: "abc123-def456-ghi789/avatar.jpg"

// Vérifier affichage:
// URL dans <AvatarImage src={...} />
// Résultat attendu: "https://xxx.supabase.co/storage/v1/object/public/avatars/abc123-def456-ghi789/avatar.jpg"
```

### 2. Suppression d'avatar

```tsx
// Après suppression:
SELECT avatar_url FROM profiles WHERE id = 'abc123-def456-ghi789';
-- Résultat attendu: NULL

// Avatar affiché: Initiales "JD" (fallback)
```

### 3. Migration de nettoyage

```sql
-- Avant migration:
SELECT COUNT(*) FROM profiles WHERE avatar_url ~ '^[0-9a-f]{8}-';
-- Exemple: 5 profils avec UUID

-- Après migration:
SELECT COUNT(*) FROM profiles WHERE avatar_url ~ '^[0-9a-f]{8}-';
-- Résultat attendu: 0
```

---

## 📊 Flux de données

### Upload d'avatar:

```
1. User sélectionne photo.jpg
   ↓
2. validateAvatarFile() → OK (< 2MB, JPEG)
   ↓
3. generateAvatarPath(userId, 'jpg') → "abc123/avatar.jpg"
   ↓
4. supabase.storage.upload('avatars', 'abc123/avatar.jpg')
   ↓
5. UPDATE profiles SET avatar_url = 'abc123/avatar.jpg'
   ↓
6. setAvatarUrl('abc123/avatar.jpg')
   ↓
7. getAvatarUrl('abc123/avatar.jpg') → "https://xxx.supabase.co/.../abc123/avatar.jpg"
   ↓
8. <AvatarImage src="https://xxx.supabase.co/.../abc123/avatar.jpg" />
```

### Affichage d'avatar:

```
1. Layout PWA fetch profiles.avatar_url → "abc123/avatar.jpg"
   ↓
2. getAvatarUrl('abc123/avatar.jpg') → URL complète
   ↓
3. Pass to <PwaAppBar user={{ avatar_url: "https://..." }} />
   ↓
4. <Avatar><AvatarImage src="https://..." /></Avatar>
```

---

## 🚀 Prochaines étapes

### 1. Exécuter la migration de nettoyage

```sql
-- Dans Supabase SQL Editor
-- Copier/coller: 20251111_fix_avatar_url_format.sql
```

### 2. Tester upload/suppression

- Uploader un avatar sur page profil
- Vérifier en DB: `SELECT avatar_url FROM profiles WHERE id = '...'`
- Vérifier affichage dans AppBar (coin haut-droite)
- Supprimer l'avatar
- Vérifier fallback sur initiales

### 3. Monitoring production

```sql
-- Voir les avatars actifs:
SELECT id, first_name, last_name, avatar_url 
FROM profiles 
WHERE avatar_url IS NOT NULL;

-- Détecter formats invalides:
SELECT id, avatar_url 
FROM profiles 
WHERE avatar_url IS NOT NULL 
  AND avatar_url NOT LIKE '%/%';
```

---

## 🔒 Sécurité Storage (rappel)

**Policies RLS sur `storage.objects` (bucket: avatars):**

```sql
-- Users upload leur propre avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users update leur propre avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users delete leur propre avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Note:** Ces policies sont à créer dans le Dashboard Supabase > Storage > avatars > Policies.

---

## ✅ Checklist finale

- [x] Helper `lib/utils/avatar.ts` créé
- [x] Composant `avatar-upload.tsx` refactorisé
- [x] Layout PWA `(pwa)/layout.tsx` refactorisé
- [x] Migration nettoyage `20251111_fix_avatar_url_format.sql` créée
- [ ] Migration nettoyage exécutée dans Supabase
- [ ] Tests upload/suppression manuels effectués
- [ ] Vérification DB après nettoyage
- [ ] Monitoring des formats invalides en production

---

**Date:** 2025-11-11  
**Status:** ✅ Correction implémentée, prête pour tests  
**Breaking changes:** Non (rétrocompatible avec URLs complètes legacy)
