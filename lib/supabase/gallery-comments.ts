/**
 * Galerie - Gestion des Commentaires
 * Fonctions CRUD pour les commentaires sur les photos
 */

import { createClient } from "@/lib/supabase/client";

export interface GalleryCommentWithAuthor {
  id: string;
  photo_id: string;
  user_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: {
    id: string;
    full_name: string;
    role: string;
  };
}

/**
 * Récupère tous les commentaires d'une photo
 */
export async function getPhotoComments(photoId: string): Promise<GalleryCommentWithAuthor[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('gallery_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        full_name,
        role
      )
    `)
    .eq('photo_id', photoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true }); // Plus anciens en premier

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data as GalleryCommentWithAuthor[];
}

/**
 * Crée un nouveau commentaire
 */
export async function createPhotoComment(photoId: string, content: string): Promise<GalleryCommentWithAuthor> {
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
    .from('gallery_comments')
    .insert({
      photo_id: photoId,
      user_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      author:profiles!user_id (
        id,
        full_name,
        role
      )
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return data as GalleryCommentWithAuthor;
}

/**
 * Met à jour un commentaire
 */
export async function updatePhotoComment(commentId: string, content: string): Promise<GalleryCommentWithAuthor> {
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
    .from('gallery_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment || existingComment.user_id !== user.id) {
    throw new Error('Unauthorized to update this comment');
  }

  const { data, error } = await supabase
    .from('gallery_comments')
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      author:profiles!user_id (
        id,
        full_name,
        role
      )
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return data as GalleryCommentWithAuthor;
}

/**
 * Soft delete d'un commentaire
 */
export async function deletePhotoComment(commentId: string): Promise<{ success: boolean }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier que le commentaire appartient à l'utilisateur
  const { data: existingComment } = await supabase
    .from('gallery_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment || existingComment.user_id !== user.id) {
    throw new Error('Unauthorized to delete this comment');
  }

  const { error } = await supabase
    .from('gallery_comments')
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
export async function flagPhotoComment(commentId: string): Promise<{ success: boolean }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('gallery_comments')
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
export async function getUserPhotoComments(userId?: string) {
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
    .from('gallery_comments')
    .select(`
      *,
      photo:gallery_photos!photo_id (
        id,
        title,
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
 * Récupère les commentaires récents (pour modération admin)
 */
export async function getRecentPhotoComments(limit: number = 20) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('gallery_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        full_name,
        role
      ),
      photo:gallery_photos!photo_id (
        id,
        title
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
export async function getFlaggedPhotoComments() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('gallery_comments')
    .select(`
      *,
      author:profiles!user_id (
        id,
        full_name,
        role
      ),
      photo:gallery_photos!photo_id (
        id,
        title
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
export async function unflagPhotoComment(commentId: string): Promise<{ success: boolean }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('gallery_comments')
    .update({ is_flagged: false })
    .eq('id', commentId);

  if (error) {
    console.error('Error unflagging comment:', error);
    throw error;
  }

  return { success: true };
}
