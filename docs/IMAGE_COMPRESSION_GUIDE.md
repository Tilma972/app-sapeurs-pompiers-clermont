# Compression d'Images - Guide d'Utilisation

## Vue d'ensemble

Le système de compression d'images permet de réduire automatiquement la taille des photos avant leur upload vers Supabase Storage, améliorant ainsi les performances et réduisant les coûts de stockage.

## Localisation

**Fonction utilitaire:** `lib/utils/image-compression.ts`

Cette fonction est **client-side uniquement** et utilise les APIs du navigateur (Canvas, Image, FileReader).

## Fonctions Disponibles

### `compressImage(file, maxWidth, quality)`

Compresse une image individuelle.

**Paramètres:**
- `file: File` - Le fichier image à compresser
- `maxWidth: number` - Largeur maximale en pixels (défaut: 1200)
- `quality: number` - Qualité JPEG de 0 à 1 (défaut: 0.85)

**Retour:**
- `Promise<File>` - Le fichier compressé au format JPEG

**Exemple:**
```typescript
import { compressImage } from "@/lib/utils/image-compression"

const compressedFile = await compressImage(file, 1200, 0.85)
```

### `compressImages(files, maxWidth, quality)`

Compresse plusieurs images en parallèle.

**Paramètres:**
- `files: File[]` - Array de fichiers à compresser
- `maxWidth: number` - Largeur maximale
- `quality: number` - Qualité JPEG

**Retour:**
- `Promise<File[]>` - Array des fichiers compressés

**Exemple:**
```typescript
import { compressImages } from "@/lib/utils/image-compression"

const compressedFiles = await compressImages(files, 1200, 0.85)
```

### `getImageDimensions(file)`

Récupère les dimensions d'une image sans la charger complètement.

**Paramètres:**
- `file: File` - Le fichier image

**Retour:**
- `Promise<{width: number, height: number}>` - Dimensions de l'image

**Exemple:**
```typescript
import { getImageDimensions } from "@/lib/utils/image-compression"

const { width, height } = await getImageDimensions(file)
console.log(`Dimensions: ${width}x${height}`)
```

## Intégration dans les Pages

### Page de Création d'Annonce

**Fichier:** `app/(pwa)/annonces/nouvelle/page.tsx`

```typescript
const [isCompressing, setIsCompressing] = useState(false)

const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files) return

  setIsCompressing(true)
  
  try {
    const compressedFiles: File[] = []
    
    for (const file of Array.from(files)) {
      // Compresser l'image
      const compressedFile = await compressImage(file, 1200, 0.85)
      compressedFiles.push(compressedFile)
    }
    
    setPhotoFiles(prev => [...prev, ...compressedFiles])
  } catch (error) {
    console.error("Erreur compression:", error)
    alert("Erreur lors du traitement des images")
  } finally {
    setIsCompressing(false)
  }
}
```

### Page de Modification

**Fichier:** `app/(pwa)/annonces/[id]/modifier/page.tsx`

Même principe que la création, mais avec distinction entre photos existantes et nouvelles photos.

## UI/UX

### Feedback Utilisateur

**État de chargement:**
```tsx
{isCompressing ? (
  <>
    <Loader2 className="animate-spin" />
    <span>Compression...</span>
  </>
) : (
  <>
    <Upload />
    <span>Ajouter</span>
  </>
)}
```

**Désactivation pendant compression:**
```tsx
<input
  type="file"
  disabled={isCompressing}
  onChange={handlePhotoUpload}
/>
```

### Messages Utilisateur

```tsx
<p className="text-xs text-muted-foreground">
  Les images seront automatiquement compressées.
</p>
```

## Performances

### Métriques Typiques

**Avant compression:**
- Photo smartphone moderne: 2-5 Mo
- Dimensions: 3000x4000 px
- Format: JPEG/PNG

**Après compression:**
- Taille: 500 Ko - 1 Mo (réduction 60-80%)
- Dimensions: max 1200px de largeur
- Format: JPEG qualité 85%

### Temps de Traitement

- **1 image:** ~200-500 ms
- **5 images:** ~1-2.5 secondes (parallèle)

## Gestion d'Erreurs

### Erreurs Possibles

1. **Fichier non-image:**
```typescript
if (!file.type.startsWith('image/')) {
  throw new Error('Le fichier doit être une image')
}
```

2. **Échec de compression:**
```typescript
try {
  const compressed = await compressImage(file)
} catch (error) {
  console.error("Erreur compression:", error)
  alert("Erreur lors du traitement de l'image")
}
```

3. **Canvas non disponible:**
```typescript
const ctx = canvas.getContext('2d')
if (!ctx) {
  throw new Error('Impossible de créer le contexte canvas')
}
```

## Limitations

### Navigateur

- ✅ Chrome/Edge: Supporté
- ✅ Firefox: Supporté
- ✅ Safari: Supporté
- ❌ IE11: Non supporté (Canvas API)

### Formats

**Entrée acceptée:**
- ✅ JPEG
- ✅ PNG
- ✅ WebP
- ✅ GIF (converti en JPEG)

**Sortie:**
- Toujours JPEG qualité 85%

### Taille

- Max avant compression: 10 Mo (recommandé)
- Max après compression: 5 Mo (validation serveur)

## Tests

### Test Unitaire

```typescript
import { compressImage } from "@/lib/utils/image-compression"

test("compresse une image correctement", async () => {
  const file = new File([...], "test.jpg", { type: "image/jpeg" })
  const compressed = await compressImage(file)
  
  expect(compressed.size).toBeLessThan(file.size)
  expect(compressed.type).toBe("image/jpeg")
})
```

### Test Manuel

1. Uploader image > 5 Mo
2. Vérifier le spinner de compression
3. Vérifier taille finale < 1 Mo
4. Vérifier qualité visuelle acceptable

## Bonnes Pratiques

### Do ✅

- Toujours compresser avant upload
- Afficher un indicateur de chargement
- Gérer les erreurs proprement
- Valider le type de fichier avant compression
- Tester sur images de différentes tailles

### Don't ❌

- Ne pas compresser côté serveur (APIs Node.js différentes)
- Ne pas bloquer l'UI pendant la compression
- Ne pas compresser plusieurs fois la même image
- Ne pas ignorer les erreurs de compression
- Ne pas utiliser qualité < 0.7 (qualité visuelle)

## Améliorations Futures

### Court Terme

- [ ] Progress bar par image
- [ ] Aperçu avant/après compression
- [ ] Choix de qualité par l'utilisateur

### Moyen Terme

- [ ] Support WebP en sortie
- [ ] Worker thread pour ne pas bloquer UI
- [ ] Compression adaptative selon réseau

### Long Terme

- [ ] Service worker pour cache
- [ ] Compression côté serveur en fallback
- [ ] CDN avec transformation automatique

---

**Dernière mise à jour:** 4 novembre 2025  
**Version:** 1.0
