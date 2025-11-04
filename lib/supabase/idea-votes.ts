/**
 * Boîte à Idées - Gestion des Votes
 * Fonctions pour voter, retirer son vote, récupérer les votes
 */

import { createClient } from "@/lib/supabase/client";
import type { VoteType, IdeaVote } from "@/lib/types/ideas.types";

/**
 * Vote pour une idée (UP ou DOWN)
 * Si l'utilisateur a déjà voté, toggle le vote :
 * - Même type : retire le vote
 * - Type différent : change le vote
 */
export async function voteIdea(ideaId: string, voteType: VoteType) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier rate limit (50 votes/24h)
  const { data: rateLimitOk } = await supabase
    .rpc('check_vote_rate_limit', { target_user_id: user.id });

  if (!rateLimitOk) {
    throw new Error('Rate limit dépassé. Maximum 50 votes par 24 heures.');
  }

  // Récupérer le vote existant
  const { data: existingVote } = await supabase
    .from('idea_votes')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Même type → Annuler le vote
      const { error } = await supabase
        .from('idea_votes')
        .delete()
        .eq('id', existingVote.id);

      if (error) {
        console.error('Error deleting vote:', error);
        throw error;
      }

      return { action: 'removed', voteType: null };
    } else {
      // Type différent → Changer le vote
      const { error } = await supabase
        .from('idea_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id);

      if (error) {
        console.error('Error updating vote:', error);
        throw error;
      }

      return { action: 'updated', voteType };
    }
  } else {
    // Pas de vote existant → Créer
    const { error } = await supabase
      .from('idea_votes')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        vote_type: voteType,
      });

    if (error) {
      console.error('Error creating vote:', error);
      throw error;
    }

    return { action: 'created', voteType };
  }
}

/**
 * Récupère le vote de l'utilisateur connecté pour une idée
 */
export async function getUserVote(ideaId: string): Promise<VoteType | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('idea_votes')
    .select('vote_type')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user vote:', error);
    return null;
  }

  return data?.vote_type || null;
}

/**
 * Récupère tous les votes d'une idée avec détails
 */
export async function getIdeaVotes(ideaId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_votes')
    .select(`
      *,
      user:profiles!user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching idea votes:', error);
    throw error;
  }

  // Calculer les stats
  const upvotes = data.filter(v => v.vote_type === 'up').length;
  const downvotes = data.filter(v => v.vote_type === 'down').length;
  const total = upvotes - downvotes;

  return {
    votes: data as IdeaVote[],
    stats: {
      upvotes,
      downvotes,
      total,
    },
  };
}

/**
 * Récupère les statistiques de votes d'une idée (sans détails)
 */
export async function getIdeaVotesStats(ideaId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('idea_votes')
    .select('vote_type')
    .eq('idea_id', ideaId);

  if (error) {
    console.error('Error fetching votes stats:', error);
    return { upvotes: 0, downvotes: 0, total: 0 };
  }

  const upvotes = data.filter(v => v.vote_type === 'up').length;
  const downvotes = data.filter(v => v.vote_type === 'down').length;

  return {
    upvotes,
    downvotes,
    total: upvotes - downvotes,
  };
}

/**
 * Récupère toutes les idées votées par l'utilisateur
 */
export async function getUserVotedIdeas(userId?: string) {
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
    .from('idea_votes')
    .select(`
      *,
      idea:ideas!idea_id (
        id,
        titre,
        description,
        categories,
        votes_count,
        comments_count,
        created_at,
        status
      )
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user voted ideas:', error);
    throw error;
  }

  return data;
}

/**
 * Vérifie si l'utilisateur peut encore voter (rate limit)
 */
export async function checkVoteRateLimit(): Promise<{
  canVote: boolean;
  votesRemaining: number;
  votesCount: number;
}> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { canVote: false, votesRemaining: 0, votesCount: 0 };
  }

  const { data: logs, error } = await supabase
    .from('idea_vote_log')
    .select('*')
    .eq('user_id', user.id)
    .gte('voted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    return { canVote: true, votesRemaining: 50, votesCount: 0 };
  }

  const votesCount = logs?.length || 0;
  const votesRemaining = Math.max(0, 50 - votesCount);
  const canVote = votesRemaining > 0;

  return { canVote, votesRemaining, votesCount };
}

/**
 * Récupère les top voteurs (leaderboard)
 */
export async function getTopVoters(limit: number = 10) {
  const supabase = createClient();
  
  // Récupérer tous les votes du dernier mois
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const { data, error } = await supabase
    .from('idea_votes')
    .select(`
      user_id,
      profiles!user_id (
        id,
        nom,
        prenom,
        avatar_url
      )
    `)
    .gte('created_at', oneMonthAgo.toISOString());

  if (error) {
    console.error('Error fetching top voters:', error);
    return [];
  }

  // Compter les votes par user
  const voterCounts: Record<string, { user: unknown; count: number }> = {};
  
  data.forEach((vote: { user_id: string; profiles: unknown }) => {
    if (!voterCounts[vote.user_id]) {
      voterCounts[vote.user_id] = {
        user: vote.profiles,
        count: 0,
      };
    }
    voterCounts[vote.user_id].count++;
  });

  return Object.values(voterCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
