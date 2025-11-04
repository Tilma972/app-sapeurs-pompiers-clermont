/**
 * CommentCard - Affichage d'un commentaire
 */

"use client";

import { useState } from "react";
import { MoreVertical, Edit, Trash2, Flag, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import type { IdeaCommentWithAuthor } from "@/lib/types/ideas.types";

interface CommentCardProps {
  comment: IdeaCommentWithAuthor;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onFlag?: (commentId: string) => Promise<void>;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const maintenant = new Date();
  const diffMinutes = Math.floor((maintenant.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  
  const diffHeures = Math.floor(diffMinutes / 60);
  if (diffHeures < 24) return `Il y a ${diffHeures}h`;
  
  const diffJours = Math.floor(diffHeures / 24);
  if (diffJours < 7) return `Il y a ${diffJours}j`;
  if (diffJours < 30) return `Il y a ${Math.floor(diffJours / 7)} semaines`;
  
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const getAuthorInitials = (author: IdeaCommentWithAuthor["author"]) => {
  if (!author || !author.full_name) return "?";
  const names = author.full_name.split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return author.full_name.slice(0, 2).toUpperCase();
};

const getAuthorName = (author: IdeaCommentWithAuthor["author"]) => {
  if (!author) return "Utilisateur";
  return author.full_name || "Utilisateur";
};

export function CommentCard({
  comment,
  currentUserId,
  isAdmin,
  onUpdate,
  onDelete,
  onFlag,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    if (editContent.length > 2000) {
      toast.error("Le commentaire ne peut pas dépasser 2000 caractères");
      return;
    }

    try {
      setLoading(true);
      await onUpdate?.(comment.id, editContent.trim());
      setIsEditing(false);
      toast.success("Commentaire modifié");
    } catch (error) {
      console.error("Erreur modification:", error);
      toast.error("Impossible de modifier le commentaire");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    try {
      setLoading(true);
      await onDelete?.(comment.id);
      toast.success("Commentaire supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer le commentaire");
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    try {
      setLoading(true);
      await onFlag?.(comment.id);
      toast.success("Commentaire signalé");
    } catch (error) {
      console.error("Erreur signalement:", error);
      toast.error("Impossible de signaler le commentaire");
    } finally {
      setLoading(false);
    }
  };

  const authorName = getAuthorName(comment.author);
  const authorInitials = getAuthorInitials(comment.author);

  return (
    <Card className={comment.is_flagged ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {authorInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-sm font-medium">{authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                  {comment.updated_at !== comment.created_at && " (modifié)"}
                </p>
              </div>

              {/* Actions */}
              {(canEdit || canDelete || !isOwner) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                    {!isOwner && (
                      <DropdownMenuItem onClick={handleFlag}>
                        <Flag className="h-4 w-4 mr-2" />
                        Signaler
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Contenu */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={2000}
                  disabled={loading}
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {editContent.length}/2000
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={loading || !editContent.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* Badge signalé */}
            {comment.is_flagged && (
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Ce commentaire a été signalé
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
