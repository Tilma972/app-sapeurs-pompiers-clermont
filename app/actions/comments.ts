/**
 * Server Actions - CRUD Commentaires
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Créer un commentaire
 */
export async function createCommentAction(ideaId: string, content: string) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Le commentaire ne peut pas être vide" };
    }

    if (content.length > 2000) {
      return { success: false, error: "Le commentaire ne peut pas dépasser 2000 caractères" };
    }

    // Créer le commentaire
    const { error } = await supabase
      .from("idea_comments")
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        content: content.trim(),
      });

    if (error) {
      console.error("Error creating comment:", error);
      return { success: false, error: "Erreur lors de la création du commentaire" };
    }

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur createCommentAction:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Modifier un commentaire
 */
export async function updateCommentAction(
  commentId: string,
  content: string,
  ideaId: string
) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Vérifier la propriété du commentaire
    const { data: comment } = await supabase
      .from("idea_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.user_id !== user.id) {
      return { success: false, error: "Vous n'êtes pas autorisé à modifier ce commentaire" };
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Le commentaire ne peut pas être vide" };
    }

    if (content.length > 2000) {
      return { success: false, error: "Le commentaire ne peut pas dépasser 2000 caractères" };
    }

    // Modifier le commentaire
    const { error } = await supabase
      .from("idea_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      console.error("Error updating comment:", error);
      return { success: false, error: "Erreur lors de la modification du commentaire" };
    }

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur updateCommentAction:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Supprimer un commentaire
 */
export async function deleteCommentAction(commentId: string, ideaId: string) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Récupérer le profil pour vérifier le rôle admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Vérifier la propriété ou admin
    const { data: comment } = await supabase
      .from("idea_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment || (comment.user_id !== user.id && !isAdmin)) {
      return { success: false, error: "Vous n'êtes pas autorisé à supprimer ce commentaire" };
    }

    // Supprimer (soft delete)
    const { error } = await supabase
      .from("idea_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: "Erreur lors de la suppression du commentaire" };
    }

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteCommentAction:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Signaler un commentaire
 */
export async function flagCommentAction(commentId: string, ideaId: string) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Vérifier que l'utilisateur ne signale pas son propre commentaire
    const { data: comment } = await supabase
      .from("idea_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (comment?.user_id === user.id) {
      return { success: false, error: "Vous ne pouvez pas signaler votre propre commentaire" };
    }

    // Signaler le commentaire
    const { error } = await supabase
      .from("idea_reports")
      .insert({
        comment_id: commentId,
        reporter_id: user.id,
        report_type: "spam",
        reason: "Contenu inapproprié",
      });

    if (error) {
      console.error("Error flagging comment:", error);
      return { success: false, error: "Erreur lors du signalement" };
    }

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur flagCommentAction:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
