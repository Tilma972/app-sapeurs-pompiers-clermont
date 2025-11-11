# 📸 Système d'Avatars - Amicale SP

## ✅ Modifications effectuées

### 1. Migration SQL (✅ Exécutée)
- ✅ Colonne `avatar_url` ajoutée à `profiles`
- ✅ Bucket Storage `avatars` créé
- ✅ Policies RLS configurées

### 2. Layout PWA (✅ Mis à jour)
**Fichier :** `app/(pwa)/layout.tsx`

**Changements :**
- ✅ Récupère `first_name`, `last_name`, `avatar_url` depuis `profiles`
- ✅ Génère les initiales depuis `first_name[0] + last_name[0]`
- ✅ Fallback sur `full_name` si first/last name non renseignés
- ✅ Affiche l'avatar si disponible, sinon les initiales

**Logique initiales :**
```tsx
const initials = profile?.first_name && profile?.last_name
  ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
  : profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'SP'
```

### 3. Composant Upload (✅ Créé)
**Fichier :** `components/profile/avatar-upload.tsx`

**Fonctionnalités :**
- ✅ Upload d'image (JPG, PNG, WEBP, max 2MB)
- ✅ Preview local avant upload
- ✅ Bouton caméra pour changer l'avatar
- ✅ Bouton X pour supprimer l'avatar
- ✅ Fallback sur initiales si pas d'avatar
- ✅ Toast notifications (succès/erreur)
- ✅ Rechargement auto après upload/suppression

### 4. Page Profil améliorée (✅ Mise à jour)
**Fichier :** `app/(pwa)/dashboard/profil/page.tsx`

**Changements :**
- ✅ Section "Photo de profil" ajoutée en haut
- ✅ Composant `AvatarUpload` intégré
- ✅ Génération des initiales pour le composant

---

## 🎨 UX Résultante

### Dans l'AppBar (header)
1. **Si avatar existe** : Affiche la photo de profil
2. **Sinon** : Affiche initiales (ex: "SD" pour Steve DONIVAR)

### Sur la page Profil
1. **Avatar avec badge caméra** (clic pour uploader)
2. **Badge X** (si avatar existe, pour supprimer)
3. **Informations sous l'avatar** : "JPG, PNG ou WEBP • Max 2MB"

---

## 🔧 Configuration Storage

### Bucket `avatars` (Supabase Dashboard)
- ✅ Public : OUI
- ✅ Max file size : 2MB
- ✅ Allowed types : image/jpeg, image/png, image/webp

### Policies RLS Storage
```sql
-- Upload (users can upload their own avatar)
bucket_id = 'avatars' 
AND auth.uid()::text = (storage.foldername(name))[1]

-- Update (users can update their own avatar)
bucket_id = 'avatars' 
AND auth.uid()::text = (storage.foldername(name))[1]

-- Delete (users can delete their own avatar)
bucket_id = 'avatars' 
AND auth.uid()::text = (storage.foldername(name))[1]

-- Select (anyone can view avatars)
bucket_id = 'avatars'
```

---

## 📁 Structure Storage

```
avatars/
├── {user_id_1}/
│   └── avatar.jpg
├── {user_id_2}/
│   └── avatar.png
└── {user_id_3}/
    └── avatar.webp
```

Chaque utilisateur a son propre dossier identifié par son `user.id`.

---

## 🧪 Test du système

### 1. Upload d'avatar
1. Aller sur `/dashboard/profil`
2. Cliquer sur l'icône caméra
3. Sélectionner une image (JPG/PNG/WEBP, < 2MB)
4. ✅ Preview local s'affiche
5. ✅ Upload automatique
6. ✅ Toast "Photo de profil mise à jour !"
7. ✅ Page se recharge
8. ✅ Avatar visible dans l'AppBar

### 2. Suppression d'avatar
1. Cliquer sur le X rouge (en haut à droite de l'avatar)
2. Confirmer la suppression
3. ✅ Toast "Photo de profil supprimée"
4. ✅ Page se recharge
5. ✅ Initiales affichées à la place

### 3. Initiales
- **Avec first_name + last_name** : Utilise premières lettres
  - Ex: Steve DONIVAR → "SD"
- **Sans first_name/last_name** : Utilise full_name
  - Ex: "John Doe" → "JD"
- **Fallback** : "SP" (Sapeurs-Pompiers)

---

## 🚀 Prochaines améliorations (optionnelles)

### Crop/Resize automatique
- Installer `sharp` ou `canvas` pour redimensionner côté serveur
- Générer des thumbnails (256x256, 512x512)
- Optimiser le poids des images

### Lazy loading avatars
- Utiliser `next/image` avec `priority={false}`
- Placeholder blur pendant chargement

### Gravatar fallback
- Si pas d'avatar + pas d'initiales : utiliser Gravatar
```tsx
const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email)}?d=mp`
```

---

## ✅ Checklist finale

- [x] Migration SQL exécutée
- [x] Bucket Storage `avatars` créé
- [x] Policies RLS configurées
- [x] Layout PWA mis à jour (initiales depuis DB)
- [x] Composant AvatarUpload créé
- [x] Page Profil améliorée
- [x] Upload fonctionnel
- [x] Suppression fonctionnelle
- [x] Fallback initiales OK

**Le système d'avatars est opérationnel ! 🎉**
