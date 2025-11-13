/**
 * IdeaCard - Composant pour afficher une idée dans le feed
 */

import Link from "next/link";
import { Clock, MessageCircle, ThumbsUp, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { IdeaWithAuthor } from "@/lib/types/ideas.types";

interface IdeaCardProps {
  idea: IdeaWithAuthor;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const maintenant = new Date();
  const diffJours = Math.floor(
    (maintenant.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffJours === 0) return "Aujourd'hui";
  if (diffJours === 1) return "Hier";
  if (diffJours < 7) return `Il y a ${diffJours} jours`;
  if (diffJours < 30) return `Il y a ${Math.floor(diffJours / 7)} semaines`;
  return `Il y a ${Math.floor(diffJours / 30)} mois`;
};

const truncateText = (text: string, maxLength: number = 150) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

const getAuthorInitials = (author: IdeaWithAuthor["author"]) => {
  if (!author || !author.prenom || !author.nom) return "?";
  return `${author.prenom[0]}${author.nom[0]}`.toUpperCase();
};

const getAuthorName = (idea: IdeaWithAuthor) => {
  if (idea.anonyme) return "Anonyme";
  if (!idea.author || !idea.author.prenom || !idea.author.nom) return "Utilisateur";
  return `${idea.author.prenom} ${idea.author.nom}`;
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const authorInitials = idea.anonyme ? "?" : getAuthorInitials(idea.author);
  const authorName = getAuthorName(idea);

  return (
    <Link href={`/idees/${idea.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          {/* Header - Auteur et date */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/10">
                  {idea.anonyme ? <User className="h-4 w-4" /> : authorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{authorName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(idea.created_at)}
                </p>
              </div>
            </div>
            
            {/* Badge IA si généré par vocal */}
            {idea.ai_generated && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                🎤 IA
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">
            {idea.titre}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateText(idea.description)}
          </p>

          {/* Catégories */}
          {idea.categories && idea.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {idea.categories.slice(0, 3).map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="text-xs py-0 h-5"
                >
                  {cat}
                </Badge>
              ))}
              {idea.categories.length > 3 && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  +{idea.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer - Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            {/* Votes */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-medium">
                  {Math.abs(idea.votes_count)}
                </span>
              </div>
            </div>

            {/* Commentaires */}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{idea.comments_count}</span>
            </div>

            {/* Vues */}
            <div className="flex items-center gap-1 ml-auto text-xs">
              <span>{idea.views_count} vue{idea.views_count > 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
