/**
 * Boîte à Idées - Fonctions CRUD Ideas
 * Gestion des idées, votes, commentaires
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Idea,
  IdeaWithAuthor,
  CreateIdeaData,
  UpdateIdeaData,
  IdeaFilters,
  IdeaStatus,
} from "@/lib/types/ideas.types";

/**
 * Récupère toutes les idées avec filtres et pagination
 */
export async function getIdeas(filters?: IdeaFilters) {
  const supabase = createClient();
  
  let query = supabase
    .from("ideas")
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        role
      )
    `, { count: 'exact' })
    .is('deleted_at', null);

  // Filtres status
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  } else {
    // Par défaut, seulement les publiées
    query = query.eq('status', 'published');
  }

  // Filtre catégories
  if (filters?.categories && filters.categories.length > 0) {
    query = query.overlaps('categories', filters.categories);
  }

  // Filtre tags
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Filtre user
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  // Search full-text
  if (filters?.search) {
    query = query.or(
      `titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // Tri
  switch (filters?.sortBy) {
    case 'popular':
      query = query.order('votes_count', { ascending: false });
      break;
    case 'trending':
      // Trending = combinaison votes + récent
      query = query.order('votes_count', { ascending: false })
                   .order('created_at', { ascending: false });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching ideas:', error);
    throw error;
  }

  return {
    ideas: (data || []) as IdeaWithAuthor[],
    total: count || 0,
    hasMore: count ? offset + limit < count : false,
  };
}

/**
 * Récupère une idée par ID avec auteur et vote de l'utilisateur
 */
export async function getIdeaById(ideaId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('ideas')
    .select(`
      *,
      author:profiles!user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('id', ideaId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching idea:', error);
    throw error;
  }

  // Récupérer le vote de l'utilisateur si authentifié
  let userVote = null;
  if (user) {
    const { data: voteData } = await supabase
      .from('idea_votes')
      .select('vote_type')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    userVote = voteData?.vote_type || null;
  }

  // Incrémenter vues via RPC (bypass RLS)
  if (data) {
    const { error: viewError } = await supabase
      .rpc('increment_idea_views', { target_idea_id: ideaId });

    if (viewError) {
      console.error('Error incrementing views:', viewError);
      // Ne pas throw - l'échec du compteur de vues ne doit pas bloquer l'affichage
    }
  }

  return {
    idea: data as IdeaWithAuthor,
    userVote,
  };
}

/**
 * Crée une nouvelle idée
 */
export async function createIdea(ideaData: CreateIdeaData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Valider les données
  if (ideaData.titre.length < 3 || ideaData.titre.length > 200) {
    throw new Error('Le titre doit contenir entre 3 et 200 caractères');
  }

  if (ideaData.description.length < 10) {
    throw new Error('La description doit contenir au moins 10 caractères');
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      titre: ideaData.titre,
      description: ideaData.description,
      audio_url: ideaData.audio_url || null,
      categories: ideaData.categories || [],
      tags: ideaData.tags || [],
      status: ideaData.status || 'published',
      anonyme: ideaData.anonyme || false,
      ai_generated: ideaData.ai_generated || false,
      ai_confidence_score: ideaData.ai_confidence_score || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating idea:', error);
    throw error;
  }

  return data as Idea;
}

/**
 * Met à jour une idée existante
 */
export async function updateIdea(ideaId: string, updates: UpdateIdeaData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier que l'idée appartient à l'utilisateur
  const { data: existingIdea } = await supabase
    .from('ideas')
    .select('user_id')
    .eq('id', ideaId)
    .single();

  if (!existingIdea || existingIdea.user_id !== user.id) {
    throw new Error('Unauthorized to update this idea');
  }

  const { data, error } = await supabase
    .from('ideas')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ideaId)
    .select()
    .single();

  if (error) {
    console.error('Error updating idea:', error);
    throw error;
  }

  return data as Idea;
}

/**
 * Soft delete d'une idée
 */
export async function deleteIdea(ideaId: string) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Vérifier que l'idée appartient à l'utilisateur
  const { data: existingIdea } = await supabase
    .from('ideas')
    .select('user_id')
    .eq('id', ideaId)
    .single();

  if (!existingIdea || existingIdea.user_id !== user.id) {
    throw new Error('Unauthorized to delete this idea');
  }

  const { error } = await supabase
    .from('ideas')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'deleted',
    })
    .eq('id', ideaId);

  if (error) {
    console.error('Error deleting idea:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Change le statut d'une idée (admin)
 */
export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ideas')
    .update({ status })
    .eq('id', ideaId);

  if (error) {
    console.error('Error updating idea status:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Récupère les idées d'un utilisateur
 */
export async function getUserIdeas(userId: string) {
  return getIdeas({
    user_id: userId,
    status: ['draft', 'published', 'archived'],
    sortBy: 'recent',
  });
}

/**
 * Récupère les catégories avec leur nombre d'idées
 */
export async function getCategoriesStats() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ideas')
    .select('categories')
    .eq('status', 'published')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Compter les occurrences de chaque catégorie
  const categoryCounts: Record<string, number> = {};
  
  data.forEach(idea => {
    idea.categories?.forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Récupère les tags populaires
 */
export async function getPopularTags(limit: number = 20) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ideas')
    .select('tags')
    .eq('status', 'published')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  // Compter les occurrences de chaque tag
  const tagCounts: Record<string, number> = {};
  
  data.forEach(idea => {
    idea.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Recherche d'idées par texte
 */
export async function searchIdeas(searchTerm: string, limit: number = 10) {
  return getIdeas({
    search: searchTerm,
    status: 'published',
    limit,
  });
}
