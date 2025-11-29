"use server";

/**
 * Server Actions pour la boîte à idées
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { VoteType } from "@/lib/types/ideas.types";

/**
 * Vote pour une idée (Server Action)
 */
export async function voteIdeaAction(ideaId: string, voteType: VoteType) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier rate limit (50 votes/24h)
    const { data: rateLimitOk } = await supabase
      .rpc('check_vote_rate_limit', { target_user_id: user.id });

    if (!rateLimitOk) {
      return { 
        success: false, 
        error: "Rate limit dépassé. Maximum 50 votes par 24 heures." 
      };
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
          return { success: false, error: "Erreur lors de la suppression du vote" };
        }

        // Récupérer le nouveau count après suppression
        const { data: updatedIdea } = await supabase
          .from('ideas')
          .select('votes_count')
          .eq('id', ideaId)
          .single();

        revalidatePath('/idees');
        revalidatePath(`/idees/${ideaId}`);
        return {
          success: true,
          action: 'removed',
          voteType: null,
          votesCount: updatedIdea?.votes_count || 0
        };
      } else {
        // Type différent → Changer le vote
        const { error } = await supabase
          .from('idea_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (error) {
          console.error('Error updating vote:', error);
          return { success: false, error: "Erreur lors de la modification du vote" };
        }

        // Récupérer le nouveau count après modification
        const { data: updatedIdea } = await supabase
          .from('ideas')
          .select('votes_count')
          .eq('id', ideaId)
          .single();

        revalidatePath('/idees');
        revalidatePath(`/idees/${ideaId}`);
        return {
          success: true,
          action: 'updated',
          voteType,
          votesCount: updatedIdea?.votes_count || 0
        };
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
        return { success: false, error: "Erreur lors de la création du vote" };
      }

      // Récupérer le nouveau count après création
      const { data: updatedIdea } = await supabase
        .from('ideas')
        .select('votes_count')
        .eq('id', ideaId)
        .single();

      revalidatePath('/idees');
      revalidatePath(`/idees/${ideaId}`);
      return {
        success: true,
        action: 'created',
        voteType,
        votesCount: updatedIdea?.votes_count || 0
      };
    }
  } catch (error) {
    console.error("voteIdeaAction error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
