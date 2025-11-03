# Guide d'intégration des Annonces/Marketplace

Ce guide explique comment intégrer le module Annonces (Amicale Market) avec Supabase.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Structure de la base de données](#structure-de-la-base-de-données)
4. [Intégration dans les pages](#intégration-dans-les-pages)
5. [Upload de photos](#upload-de-photos)
6. [Gestion des favoris](#gestion-des-favoris)

## 🏗️ Architecture

### Pages créées

- `/app/(pwa)/annonces/page.tsx` - Liste des annonces avec recherche et filtres
- `/app/(pwa)/annonces/[id]/page.tsx` - Détail d'une annonce
- `/app/(pwa)/annonces/nouvelle/page.tsx` - Création d'annonce
- `/app/(pwa)/annonces/[id]/modifier/page.tsx` - Modification d'annonce
- `/app/(pwa)/annonces/mes-annonces/page.tsx` - Gestion des annonces personnelles

### Fichiers créés

- `supabase/migrations/20241103_annonces_schema.sql` - Schéma SQL
- `lib/supabase/annonces.ts` - Fonctions d'accès aux données

## 📦 Installation

### 1. Appliquer la migration SQL

```bash
# En local avec Supabase CLI
supabase db reset

# Ou manuellement dans le dashboard Supabase
# Copier-coller le contenu de supabase/migrations/20241103_annonces_schema.sql
```

### 2. Vérifier le bucket storage

Le bucket `annonces` doit être créé automatiquement par la migration. Vérifier dans :
- Supabase Dashboard → Storage → Buckets

## 🗄️ Structure de la base de données

### Table `annonces`

```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- titre: TEXT
- description: TEXT
- prix: DECIMAL(10, 2)
- categorie: TEXT
- photos: TEXT[] (URLs des photos)
- localisation: TEXT (optionnel)
- telephone: TEXT (optionnel)
- statut: TEXT (active, desactivee, vendue, reservee)
- vues: INTEGER
- favoris: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Table `annonces_favoris`

```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- annonce_id: UUID (FK → annonces)
- created_at: TIMESTAMPTZ
- UNIQUE(user_id, annonce_id)
```

### RLS Policies

✅ Toutes les annonces actives sont visibles par tout le monde
✅ Seul le propriétaire peut modifier/supprimer ses annonces
✅ Les utilisateurs authentifiés peuvent créer des annonces
✅ Chaque utilisateur gère ses propres favoris

## 🔌 Intégration dans les pages

### Liste des annonces (`page.tsx`)

**Remplacer les données mockées par :**

```typescript
"use client"

import { useState, useEffect } from "react"
import { getAnnonces, type Annonce } from "@/lib/supabase/annonces"

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")

  useEffect(() => {
    loadAnnonces()
  }, [selectedCategory, searchQuery])

  const loadAnnonces = async () => {
    try {
      setLoading(true)
      const data = await getAnnonces({
        categorie: selectedCategory,
        search: searchQuery || undefined,
      })
      setAnnonces(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  // ... reste du composant
}
```

### Détail d'annonce (`[id]/page.tsx`)

**Remplacer le mock par :**

```typescript
import { use, useState, useEffect } from "react"
import { getAnnonceById, type Annonce } from "@/lib/supabase/annonces"

export default function AnnonceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [annonce, setAnnonce] = useState<Annonce | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnonce()
  }, [id])

  const loadAnnonce = async () => {
    try {
      const data = await getAnnonceById(id)
      setAnnonce(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Chargement...</div>
  if (!annonce) return <div>Annonce introuvable</div>

  // ... reste du composant
}
```

### Création d'annonce (`nouvelle/page.tsx`)

**Remplacer la soumission mockée par :**

```typescript
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAnnonce, uploadAnnoncePhoto } from "@/lib/supabase/annonces"
import { createClient } from "@/lib/supabase/client"

export default function NouvelleAnnoncePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Récupérer l'utilisateur
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      // 2. Upload des photos
      const photoUrls: string[] = []
      for (const photo of photos) {
        const url = await uploadAnnoncePhoto(photo, user.id)
        photoUrls.push(url)
      }

      // 3. Créer l'annonce
      await createAnnonce({
        titre: formData.titre,
        description: formData.description,
        prix: parseFloat(formData.prix),
        categorie: formData.categorie,
        photos: photoUrls,
        localisation: formData.localisation || undefined,
        telephone: formData.telephone || undefined,
      })

      // 4. Rediriger
      router.push("/annonces/mes-annonces")
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la création de l'annonce")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... reste du composant
}
```

### Mes annonces (`mes-annonces/page.tsx`)

**Remplacer les données mockées par :**

```typescript
import { useState, useEffect } from "react"
import { getMyAnnonces, updateAnnonceStatut, deleteAnnonce, type Annonce } from "@/lib/supabase/annonces"

export default function MesAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMyAnnonces()
  }, [])

  const loadMyAnnonces = async () => {
    try {
      const data = await getMyAnnonces()
      setAnnonces(data)
    } catch (error) {
      console.error("Erreur:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatut = async (id: string, currentStatut: string) => {
    try {
      const newStatut = currentStatut === "active" ? "desactivee" : "active"
      await updateAnnonceStatut(id, newStatut)
      loadMyAnnonces() // Recharger
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnonce(id)
      loadMyAnnonces() // Recharger
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  // ... reste du composant
}
```

## 📸 Upload de photos

### Gestion des fichiers locaux

```typescript
const [photos, setPhotos] = useState<File[]>([])
const [photosPreviews, setPhotosPreviews] = useState<string[]>([])

const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files) return

  if (photos.length + files.length > 5) {
    alert("Maximum 5 photos")
    return
  }

  const newFiles = Array.from(files)
  setPhotos(prev => [...prev, ...newFiles])

  // Créer les previews
  newFiles.forEach(file => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotosPreviews(prev => [...prev, reader.result as string])
    }
    reader.readAsDataURL(file)
  })
}

const removePhoto = (index: number) => {
  setPhotos(prev => prev.filter((_, i) => i !== index))
  setPhotosPreviews(prev => prev.filter((_, i) => i !== index))
}
```

### Upload vers Supabase

```typescript
import { uploadAnnoncePhoto } from "@/lib/supabase/annonces"
import { createClient } from "@/lib/supabase/client"

const uploadPhotos = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const photoUrls: string[] = []
  
  for (const photo of photos) {
    const url = await uploadAnnoncePhoto(photo, user.id)
    photoUrls.push(url)
  }
  
  return photoUrls
}
```

## ❤️ Gestion des favoris

### Ajouter/Retirer des favoris

```typescript
import { addToFavorites, removeFromFavorites } from "@/lib/supabase/annonces"

const [isFavorited, setIsFavorited] = useState(false)

const toggleFavorite = async (annonceId: string) => {
  try {
    if (isFavorited) {
      await removeFromFavorites(annonceId)
      setIsFavorited(false)
    } else {
      await addToFavorites(annonceId)
      setIsFavorited(true)
    }
  } catch (error) {
    console.error("Erreur:", error)
  }
}
```

### Page "Mes favoris"

```typescript
import { getMyFavorites, type Annonce } from "@/lib/supabase/annonces"

const [favorites, setFavorites] = useState<Annonce[]>([])

useEffect(() => {
  loadFavorites()
}, [])

const loadFavorites = async () => {
  try {
    const data = await getMyFavorites()
    setFavorites(data)
  } catch (error) {
    console.error("Erreur:", error)
  }
}
```

## 🚀 Déploiement

### 1. Appliquer les migrations en production

Dans le dashboard Supabase de production :
- SQL Editor → New Query
- Copier le contenu de `20241103_annonces_schema.sql`
- Exécuter

### 2. Vérifier les policies RLS

- Table Editor → annonces → View policies
- Storage → annonces → View policies

### 3. Tester les fonctionnalités

- ✅ Création d'annonce
- ✅ Upload de photos
- ✅ Modification d'annonce
- ✅ Changement de statut
- ✅ Suppression
- ✅ Favoris

## 🔍 Tests et debugging

### Vérifier les données

```sql
-- Voir toutes les annonces
SELECT * FROM public.annonces ORDER BY created_at DESC;

-- Voir les favoris d'un utilisateur
SELECT * FROM public.annonces_favoris WHERE user_id = 'USER_UUID';

-- Stats globales
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN statut = 'active' THEN 1 ELSE 0 END) as actives,
  SUM(vues) as total_vues
FROM public.annonces;
```

### Tester les policies

```sql
-- En tant qu'utilisateur connecté
SET request.jwt.claim.sub = 'USER_UUID';

-- Essayer de récupérer les annonces
SELECT * FROM public.annonces;
```

## 📝 Notes importantes

- Les photos sont stockées dans le bucket `annonces` avec le format : `{user_id}/{timestamp}-{random}.{ext}`
- Les compteurs de vues et favoris sont automatiquement mis à jour via des triggers
- Les annonces sont soft-deleted (on ne supprime pas, on change le statut)
- Les favoris utilisent une table de jointure pour la scalabilité

## 🎯 Prochaines étapes

1. ✅ Appliquer la migration SQL
2. ✅ Remplacer les données mockées par les appels Supabase
3. ⏳ Tester en local
4. ⏳ Ajouter une page "Mes favoris"
5. ⏳ Implémenter un système de messagerie entre acheteur/vendeur
6. ⏳ Ajouter des notifications push pour les nouveaux messages
7. ⏳ Déployer en production
