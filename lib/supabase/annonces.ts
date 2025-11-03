import { createClient } from "@/lib/supabase/client"

export type AnnonceStatut = "active" | "desactivee" | "vendue" | "reservee"

export interface Annonce {
  id: string
  user_id: string
  titre: string
  description: string
  prix: number
  categorie: string
  photos: string[]
  localisation?: string
  telephone?: string
  statut: AnnonceStatut
  vues: number
  favoris: number
  created_at: string
  updated_at: string
  // Relations jointes
  profiles?: {
    first_name: string
    last_name: string
    equipe?: string
    avatar_url?: string
  }
  is_favorited?: boolean
}

export interface AnnonceFormData {
  titre: string
  description: string
  prix: number
  categorie: string
  photos: string[]
  localisation?: string
  telephone?: string
}

/**
 * Récupère toutes les annonces actives
 */
export async function getAnnonces(options?: {
  categorie?: string
  search?: string
  limit?: number
}) {
  const supabase = createClient()
  
  let query = supabase
    .from("annonces")
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        equipe,
        avatar_url
      )
    `)
    .in("statut", ["active", "reservee"])
    .order("created_at", { ascending: false })

  if (options?.categorie && options.categorie !== "Tous") {
    query = query.eq("categorie", options.categorie)
  }

  if (options?.search) {
    query = query.or(`titre.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erreur lors de la récupération des annonces:", error)
    throw error
  }

  return data as Annonce[]
}

/**
 * Récupère une annonce par son ID
 */
export async function getAnnonceById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("annonces")
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        equipe,
        avatar_url
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erreur lors de la récupération de l'annonce:", error)
    throw error
  }

  // Incrémenter le compteur de vues
  await supabase.rpc("increment_annonce_vues", { annonce_id: id })

  return data as Annonce
}

/**
 * Récupère les annonces de l'utilisateur connecté
 */
export async function getMyAnnonces() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const { data, error } = await supabase
    .from("annonces")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur lors de la récupération de mes annonces:", error)
    throw error
  }

  return data as Annonce[]
}

/**
 * Crée une nouvelle annonce
 */
export async function createAnnonce(formData: AnnonceFormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const { data, error } = await supabase
    .from("annonces")
    .insert({
      user_id: user.id,
      ...formData,
    })
    .select()
    .single()

  if (error) {
    console.error("Erreur lors de la création de l'annonce:", error)
    throw error
  }

  return data as Annonce
}

/**
 * Met à jour une annonce
 */
export async function updateAnnonce(id: string, formData: Partial<AnnonceFormData>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("annonces")
    .update(formData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erreur lors de la mise à jour de l'annonce:", error)
    throw error
  }

  return data as Annonce
}

/**
 * Change le statut d'une annonce
 */
export async function updateAnnonceStatut(id: string, statut: AnnonceStatut) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("annonces")
    .update({ statut })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erreur lors du changement de statut:", error)
    throw error
  }

  return data as Annonce
}

/**
 * Supprime une annonce
 */
export async function deleteAnnonce(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("annonces")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Erreur lors de la suppression de l'annonce:", error)
    throw error
  }
}

/**
 * Ajoute une annonce aux favoris
 */
export async function addToFavorites(annonceId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const { error } = await supabase
    .from("annonces_favoris")
    .insert({
      user_id: user.id,
      annonce_id: annonceId,
    })

  if (error) {
    console.error("Erreur lors de l'ajout aux favoris:", error)
    throw error
  }
}

/**
 * Retire une annonce des favoris
 */
export async function removeFromFavorites(annonceId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const { error } = await supabase
    .from("annonces_favoris")
    .delete()
    .eq("user_id", user.id)
    .eq("annonce_id", annonceId)

  if (error) {
    console.error("Erreur lors du retrait des favoris:", error)
    throw error
  }
}

/**
 * Récupère les favoris de l'utilisateur
 */
export async function getMyFavorites() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  const { data, error } = await supabase
    .from("annonces_favoris")
    .select(`
      annonce_id,
      annonces (
        *,
        profiles:user_id (
          first_name,
          last_name,
          equipe,
          avatar_url
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erreur lors de la récupération des favoris:", error)
    throw error
  }

  // @ts-expect-error - Supabase typing issue with nested relations
  return data.map(item => item.annonces).filter(Boolean) as Annonce[]
}

/**
 * Vérifie si une annonce est dans les favoris
 */
export async function isFavorited(annonceId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from("annonces_favoris")
    .select("id")
    .eq("user_id", user.id)
    .eq("annonce_id", annonceId)
    .single()

  return !error && !!data
}

/**
 * Upload une photo d'annonce
 */
export async function uploadAnnoncePhoto(file: File, userId: string) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from("annonces")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    })

  if (error) {
    console.error("Erreur lors de l'upload de la photo:", error)
    throw error
  }

  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from("annonces")
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Supprime une photo d'annonce
 */
export async function deleteAnnoncePhoto(photoUrl: string) {
  const supabase = createClient()

  // Extraire le chemin depuis l'URL
  const url = new URL(photoUrl)
  const path = url.pathname.split('/annonces/')[1]

  if (!path) return

  const { error } = await supabase.storage
    .from("annonces")
    .remove([path])

  if (error) {
    console.error("Erreur lors de la suppression de la photo:", error)
    throw error
  }
}
