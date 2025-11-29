/**
 * useRealtimeVotes - Hook pour synchroniser les votes en temps réel
 *
 * Écoute les changements dans idea_votes via Supabase Realtime
 * et met à jour le compteur de votes et l'état du vote utilisateur
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VoteType } from "@/lib/types/ideas.types";

interface UseRealtimeVotesProps {
  ideaId: string;
  onVoteChange: (votesCount: number, userVote: VoteType | null) => void;
  userId?: string;
}

export function useRealtimeVotes({
  ideaId,
  onVoteChange,
  userId,
}: UseRealtimeVotesProps) {
  useEffect(() => {
    const supabase = createClient();

    // Fonction pour recompter les votes
    const refetchVotes = async () => {
      try {
        // Compter les upvotes et downvotes
        const { data: votes, error: votesError } = await supabase
          .from("idea_votes")
          .select("vote_type")
          .eq("idea_id", ideaId);

        if (votesError) {
          console.error("Error fetching votes:", votesError);
          return;
        }

        // Calculer votes_count (upvotes - downvotes)
        const upvotes = votes?.filter((v) => v.vote_type === "up").length || 0;
        const downvotes = votes?.filter((v) => v.vote_type === "down").length || 0;
        const votesCount = upvotes - downvotes;

        // Récupérer le vote de l'utilisateur si connecté
        let userVote: VoteType | null = null;
        if (userId) {
          const userVoteData = votes?.find((v) => {
            // Note: On ne peut pas filtrer par user_id dans le SELECT à cause de RLS
            // On doit faire une requête séparée
            return false; // Placeholder
          });
        }

        // Requête séparée pour le vote user (avec RLS)
        if (userId) {
          const { data: userVoteData } = await supabase
            .from("idea_votes")
            .select("vote_type")
            .eq("idea_id", ideaId)
            .eq("user_id", userId)
            .maybeSingle();

          userVote = userVoteData?.vote_type || null;
        }

        onVoteChange(votesCount, userVote);
      } catch (error) {
        console.error("Error in refetchVotes:", error);
      }
    };

    // S'abonner aux changements sur idea_votes pour cette idée
    const channel = supabase
      .channel(`idea_votes:${ideaId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "idea_votes",
          filter: `idea_id=eq.${ideaId}`,
        },
        (payload) => {
          console.log("Realtime vote change:", payload);
          refetchVotes();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to idea votes for idea ${ideaId}`);
        }
      });

    // Cleanup lors du démontage
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ideaId, userId, onVoteChange]);
}
