/**
 * IdeaVoteButtons - Composant pour voter sur une idée
 * UP/DOWN avec optimistic UI et toggle
 */

"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { voteIdea } from "@/lib/supabase/idea-votes";
import toast from "react-hot-toast";
import type { VoteType } from "@/lib/types/ideas.types";

interface IdeaVoteButtonsProps {
  ideaId: string;
  initialVotesCount: number;
  initialUserVote: VoteType | null;
  onVoteChange?: (newCount: number) => void;
}

export function IdeaVoteButtons({
  ideaId,
  initialVotesCount,
  initialUserVote,
  onVoteChange,
}: IdeaVoteButtonsProps) {
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (voteType: VoteType) => {
    if (loading) return;

    // Optimistic UI
    const previousVote = userVote;
    const previousCount = votesCount;

    try {
      setLoading(true);

      // Calculer le nouveau count de manière optimiste
      let newCount = previousCount;
      
      if (previousVote === voteType) {
        // Annuler le vote
        newCount = voteType === "up" ? previousCount - 1 : previousCount + 1;
        setUserVote(null);
      } else if (previousVote) {
        // Changer de vote (up vers down ou vice-versa)
        newCount = voteType === "up" ? previousCount + 2 : previousCount - 2;
        setUserVote(voteType);
      } else {
        // Nouveau vote
        newCount = voteType === "up" ? previousCount + 1 : previousCount - 1;
        setUserVote(voteType);
      }

      setVotesCount(newCount);
      onVoteChange?.(newCount);

      // Appel API
      const result = await voteIdea(ideaId, voteType);

      // Si le résultat indique que le vote a été retiré
      if (result.action === "removed") {
        setUserVote(null);
      }

    } catch (error: unknown) {
      // Rollback optimistic UI
      setVotesCount(previousCount);
      setUserVote(previousVote);
      onVoteChange?.(previousCount);

      console.error("Erreur vote:", error);
      
      // Vérifier si c'est une erreur de rate limit
      if (error instanceof Error && error.message.includes("Rate limit")) {
        toast.error("Limite de votes atteinte (50 votes/24h)");
      } else {
        toast.error("Impossible de voter. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bouton Upvote */}
      <Button
        variant={userVote === "up" ? "default" : "outline"}
        size="sm"
        onClick={() => handleVote("up")}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 min-w-[70px]",
          userVote === "up" && "bg-green-600 hover:bg-green-700"
        )}
      >
        {loading && userVote === "up" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        <span className="font-semibold">
          {votesCount > 0 ? `+${votesCount}` : votesCount}
        </span>
      </Button>

      {/* Bouton Downvote */}
      <Button
        variant={userVote === "down" ? "default" : "outline"}
        size="sm"
        onClick={() => handleVote("down")}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5",
          userVote === "down" && "bg-red-600 hover:bg-red-700"
        )}
      >
        {loading && userVote === "down" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
