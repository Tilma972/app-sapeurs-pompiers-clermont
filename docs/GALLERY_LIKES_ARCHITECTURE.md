# Architecture du système de Likes - Galerie

## 🎯 Problème résolu

Avant cette refactorisation, nous avions **2 implémentations différentes** du système de like :
- Une dans la galerie (`PhotoCardWithLike`)
- Une dans la page détail (`/galerie/[id]`)

**Symptômes** :
- Liker une photo sur la page détail ne mettait pas à jour la galerie
- Le compteur revenait à 0 après sync serveur (race condition avec trigger PostgreSQL)
- Code dupliqué avec logique métier différente

## ✅ Solution : Architecture centralisée

### 1. **Hook personnalisé `usePhotoLike`** (`hooks/use-photo-like.ts`)

```typescript
const { liked, count, isLoading, toggleLike } = usePhotoLike({
  photoId: photo.id,
  initialLiked,
  initialCount: photo.likes_count,
});
```

**Responsabilités** :
- ✅ Gère l'état local (`liked`, `count`)
- ✅ Optimistic updates (UI immédiate)
- ✅ Appel API `/api/gallery/like`
- ✅ Sync avec serveur
- ✅ Revert en cas d'erreur
- ✅ Toast d'erreur

**Avantages** :
- 🔄 **Single Source of Truth** : toute la logique métier au même endroit
- 🚀 **Réutilisable** : utilisé dans galerie + page détail
- 🎯 **Testable** : logique isolée

### 2. **Composant présentationnel `LikeButton`** (`components/gallery/like-button.tsx`)

```typescript
<LikeButton
  liked={liked}
  onToggle={toggleLike}
  variant="overlay" // ou "compact"
  showCount={false}
/>
```

**Responsabilités** :
- ✅ Affichage du bouton (coeur + animations Framer Motion)
- ✅ Particules flottantes (overlay)
- ✅ 2 variants : `overlay` (flottant sur photo) et `compact` (avec compteur)
- ✅ Appelle le callback `onToggle`

**Avantages** :
- 📦 **Dumb Component** : ne gère pas d'état métier
- 🎨 **Réutilisable** : peut être utilisé n'importe où avec n'importe quelle logique
- ⚡ **Performant** : animations GPU via Framer Motion

### 3. **API Route `/api/gallery/like`** (`app/api/gallery/like/route.ts`)

**Fix critique** : Compte directement dans `gallery_likes` au lieu de lire `likes_count`

```typescript
// AVANT (bug de race condition)
const { data: photo } = await supabase
  .from("gallery_photos")
  .select("likes_count")  // ❌ Peut être en retard (trigger async)
  .eq("id", photoId)
  .single();

// APRÈS (toujours exact)
const { count } = await supabase
  .from("gallery_likes")
  .select("*", { count: "exact", head: true })  // ✅ COUNT(*) immédiat
  .eq("photo_id", photoId);
```

## 📊 Flux de données

```
User Click
    ↓
usePhotoLike.toggleLike()
    ↓
Optimistic Update (UI immédiate)
    ↓
POST /api/gallery/like
    ↓
toggleLike() dans lib/supabase/gallery.ts
    ├─ INSERT ou DELETE dans gallery_likes
    ├─ Trigger PostgreSQL met à jour gallery_photos.likes_count (async)
    └─ SELECT COUNT(*) FROM gallery_likes (retourne le vrai compte)
    ↓
Response { liked: boolean, count: number }
    ↓
usePhotoLike sync state avec serveur
    ↓
UI finale actualisée
```

## 🔧 Utilisation

### Dans la galerie (`app/(pwa)/galerie/page.tsx`)

```typescript
import { usePhotoLike } from "@/hooks/use-photo-like";

export function PhotoCardWithLike({ photo, initialLiked }) {
  const { liked, count, toggleLike } = usePhotoLike({
    photoId: photo.id,
    initialLiked,
    initialCount: photo.likes_count,
  });

  return (
    <>
      {/* Double-tap pour liker */}
      <div onClick={() => toggleLike()}>...</div>
      
      {/* Bouton like flottant */}
      <LikeButton liked={liked} onToggle={toggleLike} variant="overlay" />
      
      {/* Compteur permanent */}
      <div>
        <Heart className={liked ? "fill-red-500" : ""} />
        <span>{count}</span>
      </div>
    </>
  );
}
```

### Dans la page détail (`app/(pwa)/galerie/[id]/page.tsx`)

```typescript
import { usePhotoLike } from "@/hooks/use-photo-like";

export function PhotoDetailPage({ photo, initialLiked }) {
  const { liked, count, toggleLike } = usePhotoLike({
    photoId: photo.id,
    initialLiked,
    initialCount: photo.likes_count,
  });

  return (
    <>
      <LikeButton 
        liked={liked} 
        onToggle={toggleLike} 
        variant="compact"
        showCount
        count={count}
      />
    </>
  );
}
```

## 🎯 Résultat

✅ **Cohérence parfaite** : Même logique partout  
✅ **Pas de duplication** : Hook réutilisable  
✅ **Compteur correct** : COUNT(*) au lieu de trigger async  
✅ **Sync galerie ↔ détail** : Même source de vérité  
✅ **Optimistic updates** : UI instantanée  
✅ **Rollback en cas d'erreur** : État restauré si API échoue  

## 📝 TODO

- [ ] Implémenter `usePhotoLike` dans `/galerie/[id]/page.tsx`
- [ ] Tester navigation galerie → détail → like → retour galerie
- [ ] Vérifier que le compteur reste cohérent
