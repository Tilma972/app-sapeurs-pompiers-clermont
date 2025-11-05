"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PartnerFormData = {
  id?: number
  name: string
  logo: string
  website?: string
  tier: "platinum" | "gold" | "bronze"
  sector: string
  since: number
}

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return data?.role === "admin"
}

export async function createPartner(data: PartnerFormData) {
  if (!(await isAdmin())) {
    return { error: "Non autorisé" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("landing_partners")
    .insert({
      name: data.name,
      logo: data.logo,
      website: data.website || null,
      tier: data.tier,
      sector: data.sector,
      since: data.since,
    })

  if (error) {
    console.error("Error creating partner:", error)
    return { error: "Erreur lors de la création du partenaire" }
  }

  revalidatePath("/dashboard/admin/partenaires")
  revalidatePath("/")
  return { success: true }
}

export async function updatePartner(data: PartnerFormData) {
  if (!(await isAdmin())) {
    return { error: "Non autorisé" }
  }

  if (!data.id) {
    return { error: "ID manquant" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("landing_partners")
    .update({
      name: data.name,
      logo: data.logo,
      website: data.website || null,
      tier: data.tier,
      sector: data.sector,
      since: data.since,
    })
    .eq("id", data.id)

  if (error) {
    console.error("Error updating partner:", error)
    return { error: "Erreur lors de la mise à jour du partenaire" }
  }

  revalidatePath("/dashboard/admin/partenaires")
  revalidatePath("/")
  return { success: true }
}

export async function deletePartner(id: number) {
  if (!(await isAdmin())) {
    return { error: "Non autorisé" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("landing_partners")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting partner:", error)
    return { error: "Erreur lors de la suppression du partenaire" }
  }

  revalidatePath("/dashboard/admin/partenaires")
  revalidatePath("/")
  return { success: true }
}

export async function uploadPartnerLogo(formData: FormData) {
  if (!(await isAdmin())) {
    return { error: "Non autorisé" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier sélectionné" }
  }

  // Vérifier le type de fichier
  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image" }
  }

  // Vérifier la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "L'image ne doit pas dépasser 5MB" }
  }

  const supabase = await createClient()

  // Générer un nom de fichier unique
  const fileName = `partners/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  const { error: uploadError } = await supabase.storage
    .from("landing_page")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading logo:", uploadError)
    return { error: "Erreur lors de l'upload du logo" }
  }

  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from("landing_page")
    .getPublicUrl(fileName)

  return { url: publicUrl }
}
