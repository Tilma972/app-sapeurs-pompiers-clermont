/**
 * Boîte à Idées - Gestion des Signalements
 * Fonctions pour signaler des idées/commentaires inappropriés
 */

import { createClient } from "@/lib/supabase/client";
import type { IdeaReport, ReportReason, ReportStatus } from "@/lib/types/ideas.types";

/**
 * Signale une idée
 */
export async function reportIdea(
  ideaId: string,
  reason: ReportReason,
  details?: string
) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier si l'utilisateur a déjà signalé cette idée
  const { data: existing } = await supabase
    .from('idea_reports')
    .select('id')
    .eq('idea_id', ideaId)
    .eq('reporter_user_id', user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('Vous avez déjà signalé cette idée');
  }

  const { data, error } = await supabase
    .from('idea_reports')
    .insert({
      idea_id: ideaId,
      reporter_user_id: user.id,
      reason,
      details: details || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error reporting idea:', error);
    throw error;
  }

  // Marquer l'idée comme flagged si plusieurs signalements
  const { count } = await supabase
    .from('idea_reports')
    .select('*', { count: 'exact', head: true })
    .eq('idea_id', ideaId)
    .eq('status', 'pending');

  if (count && count >= 3) {
    await supabase
      .from('ideas')
      .update({ status: 'flagged' })
      .eq('id', ideaId);
  }

  return data as IdeaReport;
}

/**
 * Signale un commentaire
 */
export async function reportComment(
  commentId: string,
  reason: ReportReason,
  details?: string
) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier si l'utilisateur a déjà signalé ce commentaire
  const { data: existing } = await supabase
    .from('idea_reports')
    .select('id')
    .eq('comment_id', commentId)
    .eq('reporter_user_id', user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('Vous avez déjà signalé ce commentaire');
  }

  const { data, error } = await supabase
    .from('idea_reports')
    .insert({
      comment_id: commentId,
      reporter_user_id: user.id,
      reason,
      details: details || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error reporting comment:', error);
    throw error;
  }

  // Marquer le commentaire comme flagged
  await supabase
    .from('idea_comments')
    .update({ is_flagged: true })
    .eq('id', commentId);

  return data as IdeaReport;
}

/**
 * Récupère tous les signalements (admin)
 */
export async function getAllReports(status?: ReportStatus) {
  const supabase = createClient();
  
  let query = supabase
    .from('idea_reports')
    .select(`
      *,
      reporter:profiles!reporter_user_id (
        id,
        nom,
        prenom,
        avatar_url
      ),
      idea:ideas (
        id,
        titre,
        status
      ),
      comment:idea_comments (
        id,
        content,
        idea_id
      ),
      reviewer:profiles!reviewed_by (
        id,
        nom,
        prenom
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère les signalements en attente (admin)
 */
export async function getPendingReports() {
  return getAllReports('pending');
}

/**
 * Met à jour le statut d'un signalement (admin)
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const updateData: {
    status: ReportStatus;
    reviewed_by: string;
    reviewed_at: string;
  } = {
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('idea_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating report status:', error);
    throw error;
  }

  return data as IdeaReport;
}

/**
 * Récupère les signalements d'une idée spécifique (admin)
 */
export async function getIdeaReports(ideaId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_reports')
    .select(`
      *,
      reporter:profiles!reporter_user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching idea reports:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère les signalements d'un commentaire spécifique (admin)
 */
export async function getCommentReports(commentId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_reports')
    .select(`
      *,
      reporter:profiles!reporter_user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comment reports:', error);
    throw error;
  }

  return data;
}

/**
 * Supprime tous les signalements d'une idée (après action admin)
 */
export async function dismissIdeaReports(ideaId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('idea_reports')
    .update({ status: 'dismissed' })
    .eq('idea_id', ideaId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error dismissing reports:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Récupère les statistiques de modération (admin)
 */
export async function getModerationStats() {
  const supabase = createClient();
  
  const { data: reports, error } = await supabase
    .from('idea_reports')
    .select('status, reason, created_at');

  if (error) {
    console.error('Error fetching moderation stats:', error);
    throw error;
  }

  const pending = reports.filter(r => r.status === 'pending').length;
  const reviewed = reports.filter(r => r.status === 'reviewed').length;
  const dismissed = reports.filter(r => r.status === 'dismissed').length;
  const actioned = reports.filter(r => r.status === 'actioned').length;

  // Stats par raison
  const reasonCounts: Record<string, number> = {};
  reports.forEach(r => {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  });

  // Signalements ce mois
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const reportsThisMonth = reports.filter(
    r => new Date(r.created_at) >= thisMonth
  ).length;

  return {
    total: reports.length,
    pending,
    reviewed,
    dismissed,
    actioned,
    reportsThisMonth,
    reasonBreakdown: reasonCounts,
  };
}
