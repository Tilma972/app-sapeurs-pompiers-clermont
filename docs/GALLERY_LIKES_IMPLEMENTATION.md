# 🎉 Système de Likes - Galerie Photo

## ✅ Fichiers créés

### 1. Migration SQL
**Fichier**: `supabase/migrations/20251106_gallery_likes_system.sql`
- ✅ Table `gallery_likes` (photo_id, user_id, created_at)
- ✅ Trigger automatique pour mettre à jour `likes_count`
- ✅ RLS policies (insert, delete, select)
- ✅ Index pour performance

### 2. Fonctions Backend
**Fichier**: `lib/supabase/gallery.ts` (ajouté)
- ✅ `toggleLike(photoId)` - Toggle like/unlike
- ✅ `getUserLikedPhotos(photoIds[])` - Récupérer les likes de l'utilisateur

### 3. API Route
**Fichier**: `app/api/gallery/like/route.ts`
- ✅ POST endpoint pour toggle like
- ✅ Gestion d'erreurs (auth, validation)
- ✅ Retourne `{ liked: boolean, count: number }`

### 4. Composants React
**Fichier**: `components/gallery/like-button.tsx`
- ✅ 2 variants : `compact` (grille) et `overlay` (flottant)
- ✅ Animation particules lors du like
- ✅ Optimistic update + sync serveur
- ✅ Gestion erreurs avec rollback

**Fichier**: `components/gallery/photo-card-with-like.tsx`
- ✅ Card photo avec double-tap pour liker
- ✅ Animation coeur géant (style Instagram)
- ✅ Bouton like visible au hover
- ✅ Badge catégorie
- ✅ Titre + description

### 5. Intégration Page Galerie
**Fichier**: `app/(pwa)/galerie/page.tsx` (modifié)
- ✅ Import `getUserLikedPhotos`
- ✅ Récupération des likes au chargement
- ✅ Utilisation de `PhotoCardWithLike`

## 📋 Étapes de déploiement

### 1. Exécuter la migration SQL
```sql
-- Copiez le contenu de : supabase/migrations/20251106_gallery_likes_system.sql
-- Exécutez dans : Supabase Dashboard > SQL Editor
```

### 2. Build local
```powershell
npm run build
```

### 3. Tester localement
```powershell
npm run dev
```

**Tests à faire** :
- ✅ Cliquer sur le bouton like (compact)
- ✅ Double-tap sur une photo pour liker
- ✅ Vérifier l'animation coeur géant
- ✅ Vérifier que le compteur s'incrémente
- ✅ Unlike et vérifier que le compteur décrémente
- ✅ Actualiser la page et vérifier que les likes persistent

### 4. Vérifier en base de données
```sql
-- Vérifier les likes
SELECT * FROM gallery_likes ORDER BY created_at DESC LIMIT 10;

-- Vérifier les compteurs
SELECT id, title, likes_count FROM gallery_photos ORDER BY likes_count DESC LIMIT 10;
```

### 5. Déployer sur Vercel
```powershell
git add .
git commit -m "feat: Add likes system to gallery with double-tap and animations"
git push origin main
```

## 🎨 Fonctionnalités

### Double-tap pour liker
- Touchez rapidement 2 fois la photo
- Animation coeur géant au centre
- Like automatique (ne fonctionne que si pas déjà liké)

### Bouton like hover
- Survolez la photo (desktop) ou touchez (mobile)
- Bouton like flottant apparaît en bas à droite
- Variant `overlay` avec backdrop-blur

### Animation particules
- 6 particules rouges en cercle
- Animation ping de 600ms
- Délai progressif (50ms * index)

### Optimistic updates
- Like instantané dans l'UI
- Appel API en arrière-plan
- Rollback automatique en cas d'erreur

## 🔄 Prochaines étapes (Priorité 2)

### Système de Commentaires
1. Créer `gallery_comments` (similaire à `idea_comments`)
2. Dupliquer `lib/supabase/idea-comments.ts` → `gallery-comments.ts`
3. Créer API route `/api/gallery/comment`
4. Réutiliser `<CommentsSection>` existant

### Métadonnées enrichies (Priorité 3)
1. Ajouter colonnes : `location`, `event_name`, `photographer_id`
2. Créer composant `<PhotoInfoSection>`
3. Afficher dans la page détail `/galerie/[id]`

## 🐛 Dépannage

### Les likes ne s'affichent pas
```sql
-- Vérifier la table
SELECT * FROM gallery_likes LIMIT 5;

-- Vérifier les RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'gallery_likes';
```

### Erreur "not_authenticated"
- Vérifier que l'utilisateur est connecté
- Vérifier les cookies Supabase
- Redémarrer le serveur dev

### Double-tap ne fonctionne pas
- Délai entre taps : 300ms max
- Vérifier que `liked` est `false` initialement
- Vérifier dans les DevTools console

## 📊 Métriques

Une fois déployé, vous pourrez tracker :
- Photos les plus likées
- Utilisateurs les plus actifs
- Évolution des likes dans le temps

```sql
-- Top 10 photos likées
SELECT 
  p.title, 
  p.likes_count,
  COUNT(l.user_id) as total_likes
FROM gallery_photos p
LEFT JOIN gallery_likes l ON l.photo_id = p.id
GROUP BY p.id
ORDER BY p.likes_count DESC
LIMIT 10;
```
