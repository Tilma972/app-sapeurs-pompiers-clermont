/**
 * Boîte à Idées - Statistiques et Analytics
 * Dashboard admin et métriques
 */

import { createClient } from "@/lib/supabase/client";
import type { IdeaStats, IdeaWithAuthor } from "@/lib/types/ideas.types";

/**
 * Récupère toutes les statistiques pour le dashboard admin
 */
export async function getIdeasDashboardStats(): Promise<IdeaStats> {
  const supabase = createClient();
  
  // Total des idées
  const { count: totalIdeas } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Idées ce mois
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const { count: ideasThisMonth } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', thisMonth.toISOString());

  // En attente de modération
  const { count: pendingModeration } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'flagged');

  // Top 5 idées du mois
  const { data: topIdeas } = await supabase
    .from('ideas')
    .select(`
      *,
      author:profiles!user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .gte('created_at', thisMonth.toISOString())
    .order('votes_count', { ascending: false })
    .limit(5);

  // Trending keywords (tags)
  const { data: allIdeas } = await supabase
    .from('ideas')
    .select('tags')
    .eq('status', 'published')
    .is('deleted_at', null)
    .gte('created_at', thisMonth.toISOString());

  const tagCounts: Record<string, number> = {};
  allIdeas?.forEach(idea => {
    idea.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const trendingKeywords = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Idées par catégorie
  const { data: categoriesData } = await supabase
    .from('ideas')
    .select('categories')
    .eq('status', 'published')
    .is('deleted_at', null);

  const categoryCounts: Record<string, number> = {};
  categoriesData?.forEach(idea => {
    idea.categories?.forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  const ideasByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_ideas: totalIdeas || 0,
    ideas_this_month: ideasThisMonth || 0,
    pending_moderation: pendingModeration || 0,
    trending_keywords: trendingKeywords,
    top_ideas: (topIdeas || []) as IdeaWithAuthor[],
    ideas_by_category: ideasByCategory,
  };
}

/**
 * Récupère les statistiques d'engagement (vues, votes, commentaires)
 */
export async function getEngagementStats(period: 'week' | 'month' | 'year' = 'month') {
  const supabase = createClient();
  
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Idées créées dans la période
  const { data: ideas } = await supabase
    .from('ideas')
    .select('id, views_count, votes_count, comments_count, created_at')
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString());

  const totalViews = ideas?.reduce((sum, idea) => sum + (idea.views_count || 0), 0) || 0;
  const totalVotes = ideas?.reduce((sum, idea) => sum + Math.abs(idea.votes_count || 0), 0) || 0;
  const totalComments = ideas?.reduce((sum, idea) => sum + (idea.comments_count || 0), 0) || 0;

  // Votes dans la période
  const { count: votesCount } = await supabase
    .from('idea_votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString());

  // Commentaires dans la période
  const { count: commentsCount } = await supabase
    .from('idea_comments')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString());

  return {
    period,
    total_ideas: ideas?.length || 0,
    total_views: totalViews,
    total_votes: totalVotes,
    total_comments: totalComments,
    new_votes: votesCount || 0,
    new_comments: commentsCount || 0,
    avg_votes_per_idea: ideas && ideas.length > 0 ? totalVotes / ideas.length : 0,
    avg_comments_per_idea: ideas && ideas.length > 0 ? totalComments / ideas.length : 0,
  };
}

/**
 * Récupère les top contributeurs (créateurs d'idées)
 */
export async function getTopContributors(limit: number = 10) {
  const supabase = createClient();
  
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      user_id,
      votes_count,
      profiles!user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .is('deleted_at', null);

  if (!ideas) return [];

  // Grouper par user_id
  const userStats: Record<string, {
    user: unknown;
    ideasCount: number;
    totalVotes: number;
  }> = {};

  ideas.forEach((idea: { user_id: string; votes_count: number; profiles: unknown }) => {
    if (!userStats[idea.user_id]) {
      userStats[idea.user_id] = {
        user: idea.profiles,
        ideasCount: 0,
        totalVotes: 0,
      };
    }
    userStats[idea.user_id].ideasCount++;
    userStats[idea.user_id].totalVotes += idea.votes_count || 0;
  });

  return Object.values(userStats)
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, limit);
}

/**
 * Exporte toutes les idées en CSV (admin)
 */
export async function exportIdeasToCSV() {
  const supabase = createClient();
  
  const { data: ideas } = await supabase
    .from('ideas')
    .select(`
      *,
      author:profiles!user_id (
        id,
        nom,
        prenom
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (!ideas || ideas.length === 0) {
    return null;
  }

  // Construire le CSV
  const headers = [
    'ID',
    'Titre',
    'Description',
    'Catégories',
    'Tags',
    'Auteur',
    'Anonyme',
    'Votes',
    'Commentaires',
    'Vues',
    'Statut',
    'IA',
    'Date création',
    'Date publication',
  ];

  const rows = ideas.map((idea: {
    id: string;
    titre: string;
    description: string;
    categories: string[];
    tags: string[];
    author: { id: string; nom: string | null; prenom: string | null };
    anonyme: boolean;
    votes_count: number;
    comments_count: number;
    views_count: number;
    status: string;
    ai_generated: boolean;
    created_at: string;
    published_at: string | null;
  }) => {
    const authorName = idea.anonyme
      ? 'Anonyme'
      : (idea.author?.prenom && idea.author?.nom) 
        ? `${idea.author.prenom} ${idea.author.nom}`
        : 'Utilisateur';

    return [
      idea.id,
      `"${idea.titre.replace(/"/g, '""')}"`, // Échapper les guillemets
      `"${idea.description.replace(/"/g, '""')}"`,
      `"${idea.categories?.join(', ') || ''}"`,
      `"${idea.tags?.join(', ') || ''}"`,
      `"${authorName}"`,
      idea.anonyme ? 'Oui' : 'Non',
      idea.votes_count,
      idea.comments_count,
      idea.views_count,
      idea.status,
      idea.ai_generated ? 'Oui' : 'Non',
      new Date(idea.created_at).toLocaleDateString('fr-FR'),
      idea.published_at ? new Date(idea.published_at).toLocaleDateString('fr-FR') : '',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  
  return csv;
}

/**
 * Récupère l'évolution temporelle (graphique)
 */
export async function getIdeasTimeline(days: number = 30) {
  const supabase = createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: ideas } = await supabase
    .from('ideas')
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString());

  if (!ideas) return [];

  // Grouper par jour
  const dailyCounts: Record<string, number> = {};
  
  ideas.forEach((idea: { created_at: string }) => {
    const date = new Date(idea.created_at).toLocaleDateString('fr-FR');
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Récupère les statistiques par catégorie
 */
export async function getCategoryStats() {
  const supabase = createClient();
  
  const { data: ideas } = await supabase
    .from('ideas')
    .select('categories, votes_count, comments_count, views_count')
    .eq('status', 'published')
    .is('deleted_at', null);

  if (!ideas) return [];

  const categoryStats: Record<string, {
    count: number;
    totalVotes: number;
    totalComments: number;
    totalViews: number;
  }> = {};

  ideas.forEach((idea: {
    categories: string[];
    votes_count: number;
    comments_count: number;
    views_count: number;
  }) => {
    idea.categories?.forEach((cat: string) => {
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          count: 0,
          totalVotes: 0,
          totalComments: 0,
          totalViews: 0,
        };
      }
      categoryStats[cat].count++;
      categoryStats[cat].totalVotes += idea.votes_count || 0;
      categoryStats[cat].totalComments += idea.comments_count || 0;
      categoryStats[cat].totalViews += idea.views_count || 0;
    });
  });

  return Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      ...stats,
      avgVotes: stats.count > 0 ? stats.totalVotes / stats.count : 0,
      avgComments: stats.count > 0 ? stats.totalComments / stats.count : 0,
      avgViews: stats.count > 0 ? stats.totalViews / stats.count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
