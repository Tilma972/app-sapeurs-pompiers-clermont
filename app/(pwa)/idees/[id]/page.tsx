/**
 * Page Détail Idée
 * Affichage complet d'une idée avec votes et commentaires
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Mic, Edit, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { IdeaVoteButtons } from "@/components/idees/idea-vote-buttons";
import { CommentPreview } from "@/components/idees/comment-preview";
import { ShareButton } from "@/components/idees/share-button";
import { getIdeaById } from "@/lib/supabase/ideas";
import { getIdeaComments } from "@/lib/supabase/idea-comments";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: {
    id: string;
  };
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAuthorInitials = (prenom?: string | null, nom?: string | null) => {
  if (!prenom || !nom) return "?";
  return `${prenom[0]}${nom[0]}`.toUpperCase();
};

const getAuthorName = (idea: Awaited<ReturnType<typeof getIdeaById>>["idea"]) => {
  if (idea.anonyme) return "Anonyme";
  if (!idea.author) return "Utilisateur";
  return `${idea.author.prenom || ""} ${idea.author.nom || ""}`.trim() || "Utilisateur";
};

export default async function IdeaDetailPage({ params }: PageProps) {
  const { id } = params;

  // Récupérer l'idée
  const { idea, userVote } = await getIdeaById(id);

  if (!idea) {
    notFound();
  }

  // Récupérer les commentaires
  const comments = await getIdeaComments(id);

  // Vérifier si l'utilisateur est admin ou propriétaire
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  let isOwner = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    isAdmin = profile?.role === "admin";
    isOwner = user.id === idea.user_id;
  }

  const authorName = getAuthorName(idea);
  const authorInitials = idea.anonyme ? "?" : getAuthorInitials(idea.author?.prenom, idea.author?.nom);

  return (
    <PwaContainer>
      <div className="space-y-6 pb-8">
        {/* Header avec retour */}
        <div className="flex items-center gap-3">
          <Link href="/idees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold line-clamp-1">Détail de l&apos;idée</h1>
          </div>
          <ShareButton ideaId={idea.id} title={idea.titre} />
        </div>

        {/* Contenu principal */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* En-tête avec auteur */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {!idea.anonyme && idea.author?.avatar_url && (
                    <AvatarImage src={idea.author.avatar_url} alt={authorName} />
                  )}
                  <AvatarFallback className="text-sm">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{authorName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(idea.created_at)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {idea.views_count} vue{idea.views_count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge IA si vocal */}
              {idea.ai_generated && (
                <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                  <Mic className="h-3 w-3" />
                  Créé par IA
                </Badge>
              )}
            </div>

            <Separator />

            {/* Titre */}
            <h2 className="text-2xl font-bold leading-tight">{idea.titre}</h2>

            {/* Description */}
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {idea.description}
            </p>

            {/* Audio player si vocal */}
            {idea.audio_url && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Enregistrement audio
                </p>
                <audio controls className="w-full">
                  <source src={idea.audio_url} type="audio/webm" />
                  <source src={idea.audio_url} type="audio/mp4" />
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
              </div>
            )}

            {/* Catégories */}
            {idea.categories && idea.categories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Catégories</p>
                <div className="flex flex-wrap gap-2">
                  {idea.categories.map((cat) => (
                    <Badge key={cat} variant="outline">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {idea.tags && idea.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Votes */}
            <div>
              <p className="text-sm font-medium mb-3">Votez pour cette idée</p>
              <IdeaVoteButtons
                ideaId={idea.id}
                initialVotesCount={idea.votes_count}
                initialUserVote={userVote}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions admin/propriétaire */}
        {(isAdmin || isOwner) && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Actions</p>
              <div className="flex flex-wrap gap-2">
                {isOwner && (
                  <Link href={`/idees/${idea.id}/modifier`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section commentaires */}
        <div id="commentaires">
          <CommentPreview
            comments={comments}
            totalCount={idea.comments_count}
            ideaId={idea.id}
          />
        </div>
      </div>
    </PwaContainer>
  );
}
