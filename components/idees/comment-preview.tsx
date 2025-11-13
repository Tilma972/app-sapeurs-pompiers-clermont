/**
 * CommentPreview - Aperçu des commentaires sur la page détail
 */

"use client";

import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { IdeaCommentWithAuthor } from "@/lib/types/ideas.types";

interface CommentPreviewProps {
  comments: IdeaCommentWithAuthor[];
  totalCount: number;
  ideaId: string;
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
  
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const getAuthorInitials = (author: IdeaCommentWithAuthor["author"]) => {
  if (!author || !author.last_name || !author.first_name) return "?";
  return `${author.last_name[0]}${author.first_name[0]}`.toUpperCase();
};

const getAuthorName = (author: IdeaCommentWithAuthor["author"]) => {
  if (!author || !author.last_name || !author.first_name) return "Utilisateur";
  return `${author.last_name} ${author.first_name}`;
};

export function CommentPreview({ comments, totalCount, ideaId }: CommentPreviewProps) {
  const displayedComments = comments.slice(0, 3);
  const hasMore = totalCount > 3;

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucun commentaire pour le moment
            </p>
            <p className="text-xs text-muted-foreground">
              Soyez le premier à commenter cette idée
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({totalCount})
        </h3>
        {hasMore && (
          <Link href={`/idees/${ideaId}#commentaires`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Voir tout
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {displayedComments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getAuthorInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-sm font-medium">
                      {getAuthorName(comment.author)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {comment.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <Link href={`/idees/${ideaId}#commentaires`}>
          <Button variant="outline" className="w-full">
            Voir les {totalCount - 3} autres commentaires
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      )}
    </div>
  );
}
