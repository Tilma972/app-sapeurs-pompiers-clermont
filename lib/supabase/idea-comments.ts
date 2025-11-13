/**
 * Boîte à Idées - Gestion des Commentaires
 * Fonctions CRUD pour les commentaires sur les idées
 */

import { createClient } from "@/lib/supabase/client";
import type { IdeaCommentWithAuthor } from "@/lib/types/ideas.types";

/**
 * Récupère tous les commentaires d'une idée
 */
export async function getIdeaComments(ideaId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .eq('idea_id', ideaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true }); // Plus anciens en premier

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data as IdeaCommentWithAuthor[];
}

/**
 * Crée un nouveau commentaire
 */
export async function createComment(ideaId: string, content: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Valider le contenu
  if (!content || content.trim().length === 0) {
    throw new Error('Le commentaire ne peut pas être vide');
  }

  if (content.length > 2000) {
    throw new Error('Le commentaire ne peut pas dépasser 2000 caractères');
  }

  const { data, error } = await supabase
    .from('idea_comments')
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return data as IdeaCommentWithAuthor;
}

/**
 * Met à jour un commentaire
 */
export async function updateComment(commentId: string, content: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Valider le contenu
  if (!content || content.trim().length === 0) {
    throw new Error('Le commentaire ne peut pas être vide');
  }

  if (content.length > 2000) {
    throw new Error('Le commentaire ne peut pas dépasser 2000 caractères');
  }

  // Vérifier que le commentaire appartient à l'utilisateur
  const { data: existingComment } = await supabase
    .from('idea_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment || existingComment.user_id !== user.id) {
    throw new Error('Unauthorized to update this comment');
  }

  const { data, error } = await supabase
    .from('idea_comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return data as IdeaCommentWithAuthor;
}

/**
 * Soft delete d'un commentaire
 */
export async function deleteComment(commentId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier que le commentaire appartient à l'utilisateur
  const { data: existingComment } = await supabase
    .from('idea_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment || existingComment.user_id !== user.id) {
    throw new Error('Unauthorized to delete this comment');
  }

  const { error } = await supabase
    .from('idea_comments')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Signale un commentaire (flag)
 */
export async function flagComment(commentId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('idea_comments')
    .update({ is_flagged: true })
    .eq('id', commentId);

  if (error) {
    console.error('Error flagging comment:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Récupère tous les commentaires d'un utilisateur
 */
export async function getUserComments(userId?: string) {
  const supabase = createClient();
  
  let targetUserId = userId;
  
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from('idea_comments')
    .select(`
      *,
      idea:ideas!idea_id (
        id,
        titre,
        status
      )
    `)
    .eq('user_id', targetUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user comments:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère le nombre de commentaires par idée (batch)
 */
export async function getCommentsCountByIdeas(ideaIds: string[]) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select('idea_id')
    .in('idea_id', ideaIds)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching comments count:', error);
    return {};
  }

  // Compter par idée
  const counts: Record<string, number> = {};
  data.forEach((comment: { idea_id: string }) => {
    counts[comment.idea_id] = (counts[comment.idea_id] || 0) + 1;
  });

  return counts;
}

/**
 * Récupère les commentaires récents (pour modération admin)
 */
export async function getRecentComments(limit: number = 20) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      idea:ideas!idea_id (
        id,
        titre
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent comments:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère les commentaires signalés (pour modération admin)
 */
export async function getFlaggedComments() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      idea:ideas!idea_id (
        id,
        titre
      )
    `)
    .eq('is_flagged', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching flagged comments:', error);
    throw error;
  }

  return data;
}

/**
 * Retire le flag d'un commentaire (admin)
 */
export async function unflagComment(commentId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('idea_comments')
    .update({ is_flagged: false })
    .eq('id', commentId);

  if (error) {
    console.error('Error unflagging comment:', error);
    throw error;
  }

  return { success: true };
}
