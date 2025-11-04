/**
 * Server Actions - CRUD Commentaires
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/lib/supabase/idea-comments";
import { reportComment } from "@/lib/supabase/idea-reports";

/**
 * Créer un commentaire
 */
export async function createCommentAction(ideaId: string, content: string) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // Validation
    if (!content || content.trim().length === 0) {
      throw new Error("Le commentaire ne peut pas être vide");
    }

    if (content.length > 2000) {
      throw new Error("Le commentaire ne peut pas dépasser 2000 caractères");
    }

    // Créer le commentaire
    await createComment(ideaId, content.trim());

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur createCommentAction:", error);
    throw error;
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
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // Vérifier la propriété du commentaire
    const { data: comment } = await supabase
      .from("idea_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment || comment.user_id !== user.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier ce commentaire");
    }

    // Validation
    if (!content || content.trim().length === 0) {
      throw new Error("Le commentaire ne peut pas être vide");
    }

    if (content.length > 2000) {
      throw new Error("Le commentaire ne peut pas dépasser 2000 caractères");
    }

    // Modifier le commentaire
    await updateComment(commentId, content.trim());

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur updateCommentAction:", error);
    throw error;
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
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
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
      throw new Error("Vous n'êtes pas autorisé à supprimer ce commentaire");
    }

    // Supprimer le commentaire
    await deleteComment(commentId);

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteCommentAction:", error);
    throw error;
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
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // Vérifier que l'utilisateur ne signale pas son propre commentaire
    const { data: comment } = await supabase
      .from("idea_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (comment?.user_id === user.id) {
      throw new Error("Vous ne pouvez pas signaler votre propre commentaire");
    }

    // Signaler le commentaire
    await reportComment(commentId, "spam", "Contenu inapproprié");

    // Revalider la page
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur flagCommentAction:", error);
    throw error;
  }
}
