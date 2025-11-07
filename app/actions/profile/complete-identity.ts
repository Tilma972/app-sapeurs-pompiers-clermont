"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CompleteIdentityData = {
  first_name: string
  last_name: string
  display_name?: string | null
}

export async function completeIdentity(data: CompleteIdentityData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  // Validation
  if (!data.first_name?.trim() || !data.last_name?.trim()) {
    return { error: "Le prénom et le nom sont requis" }
  }

  // Mettre à jour le profil
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      display_name: data.display_name?.trim() || null,
      // Note: identity_verified sera mis à true par un admin
    // FICHIER SUPPRIMÉ : remplacé par update-profile.ts


  if (!user) {
  const { data: adminProfile } = await supabase


  }

  // Vérifier l'identité
  const { error } = await supabase
    .from("profiles")
    .update({
      identity_verified: true,
      verification_date: new Date().toISOString(),
      verification_method: "admin",
    })
    .eq("id", userId)

  if (error) {
    console.error("Error verifying identity:", error)
    return { error: "Erreur lors de la vérification" }
  }

  revalidatePath("/dashboard/admin/pending")
  revalidatePath("/dashboard/admin/users")

  return { success: true }
}

/**
 * Admin: Révoquer la vérification d'identité
 */
export async function revokeIdentityVerification(userId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  // Vérifier que l'utilisateur est admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!adminProfile || adminProfile.role !== "admin") {
    return { error: "Non autorisé" }
  }

  // Révoquer la vérification
  const { error } = await supabase
    .from("profiles")
    .update({
      identity_verified: false,
      verification_date: null,
      verification_method: null,
    })
    .eq("id", userId)

  if (error) {
    console.error("Error revoking verification:", error)
    return { error: "Erreur lors de la révocation" }
  }

  revalidatePath("/dashboard/admin/pending")
  revalidatePath("/dashboard/admin/users")

  return { success: true }
}
