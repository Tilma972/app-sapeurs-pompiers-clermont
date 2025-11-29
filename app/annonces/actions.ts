"use server";

/**
 * Server Actions pour le module Petites Annonces
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Toggle favorite pour une annonce (Server Action)
 * Ajoute ou retire une annonce des favoris selon l'état actuel
 */
export async function toggleFavoriteAction(annonceId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier si l'annonce est déjà en favoris
    const { data: existingFavorite } = await supabase
      .from('annonces_favoris')
      .select('*')
      .eq('annonce_id', annonceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingFavorite) {
      // Déjà en favoris → Retirer
      const { error } = await supabase
        .from('annonces_favoris')
        .delete()
        .eq('id', existingFavorite.id);

      if (error) {
        console.error('Error removing favorite:', error);
        return { success: false, error: "Erreur lors du retrait des favoris" };
      }

      revalidatePath('/annonces');
      revalidatePath(`/annonces/${annonceId}`);
      revalidatePath('/annonces/mes-favoris');
      return { success: true, action: 'removed', isFavorite: false };
    } else {
      // Pas en favoris → Ajouter
      const { error } = await supabase
        .from('annonces_favoris')
        .insert({
          annonce_id: annonceId,
          user_id: user.id,
        });

      if (error) {
        console.error('Error adding favorite:', error);
        return { success: false, error: "Erreur lors de l'ajout aux favoris" };
      }

      revalidatePath('/annonces');
      revalidatePath(`/annonces/${annonceId}`);
      revalidatePath('/annonces/mes-favoris');
      return { success: true, action: 'added', isFavorite: true };
    }
  } catch (error) {
    console.error("toggleFavoriteAction error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
