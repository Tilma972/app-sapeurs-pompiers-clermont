"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ProductFormData = {
  id?: string
  name: string
  category: string
  description: string
  price: number
  stock: number
  image_url?: string
  badge_text?: string
  badge_variant?: "preorder" | "new" | "promo" | null
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function createProduct(data: ProductFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return { error: "Non autorisé" }
  }

  let status = "in_stock"
  if (data.stock === 0) {
    status = "out_of_stock"
  } else if (data.stock < 10) {
    status = "low_stock"
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      category: data.category,
      description: data.description,
      price: data.price,
      stock: data.stock,
      image_url: data.image_url,
      badge_text: data.badge_text || null,
      badge_variant: data.badge_variant || null,
      status,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating product:", error)
    return { error: "Erreur lors de la création du produit" }
  }

  revalidatePath("/admin/produits")
  revalidatePath("/boutique")
  return { product }
}

export async function updateProduct(data: ProductFormData) {
  const supabase = await createClient()

  if (!data.id) {
    return { error: "ID du produit manquant" }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return { error: "Non autorisé" }
  }

  let status = "in_stock"
  if (data.stock === 0) {
    status = "out_of_stock"
  } else if (data.stock < 10) {
    status = "low_stock"
  }

  const { data: product, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      category: data.category,
      description: data.description,
      price: data.price,
      stock: data.stock,
      image_url: data.image_url,
      badge_text: data.badge_text || null,
      badge_variant: data.badge_variant || null,
      status,
    })
    .eq("id", data.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating product:", error)
    return { error: "Erreur lors de la mise à jour du produit" }
  }

  revalidatePath("/admin/produits")
  revalidatePath("/boutique")
  return { product }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)

  if (error) {
    console.error("Error deleting product:", error)
    return { error: "Erreur lors de la suppression du produit" }
  }

  revalidatePath("/admin/produits")
  revalidatePath("/boutique")
  return { success: true }
}

export async function uploadProductImage(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Non authentifié" }
  }

  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return { error: "Non autorisé" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier sélectionné" }
  }

  // Validation MIME côté serveur (la vérification client-side est contournable)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Format non autorisé. Utilisez JPEG, PNG, WebP ou GIF." }
  }

  // Limite de taille : 5 MB
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "Image trop volumineuse (max 5 Mo)." }
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage
    .from("landing_page")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    console.error("Error uploading image:", error)
    return { error: "Erreur lors de l'upload de l'image" }
  }

  const { data: { publicUrl } } = supabase.storage
    .from("landing_page")
    .getPublicUrl(filePath)

  return { url: publicUrl }
}
