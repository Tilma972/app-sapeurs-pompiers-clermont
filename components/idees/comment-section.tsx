/**
 * CommentSection - Section complète des commentaires
 */

"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./comment-card";
import { CommentForm } from "./comment-form";
import type { IdeaCommentWithAuthor } from "@/lib/types/ideas.types";

interface CommentSectionProps {
  ideaId: string;
  initialComments: IdeaCommentWithAuthor[];
  currentUserId?: string;
  isAdmin?: boolean;
  onCreateComment: (content: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onFlagComment: (commentId: string) => Promise<void>;
}

export function CommentSection({
  initialComments,
  currentUserId,
  isAdmin,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onFlagComment,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCreateComment = async (content: string) => {
    await onCreateComment(content);
    // Recharger les commentaires après ajout
    window.location.reload();
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    await onUpdateComment(commentId, content);
    // Mettre à jour l'état local
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content, updated_at: new Date().toISOString() }
          : c
      )
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    await onDeleteComment(commentId);
    // Supprimer du state local
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleFlagComment = async (commentId: string) => {
    await onFlagComment(commentId);
    // Marquer comme signalé localement
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, is_flagged: true } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Commentaires ({comments.length})
            </h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Contenu */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Formulaire d'ajout */}
          {currentUserId && (
            <CommentForm onSubmit={handleCreateComment} />
          )}

          {/* Liste des commentaires */}
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Aucun commentaire</p>
              <p className="text-sm">
                Soyez le premier à partager votre point de vue
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onFlag={handleFlagComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
