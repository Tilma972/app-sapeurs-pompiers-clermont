import { getPhotoById } from "@/lib/supabase/gallery";
import { getPhotoComments, createPhotoComment, updatePhotoComment, deletePhotoComment, flagPhotoComment } from "@/lib/supabase/gallery-comments";
import type { IdeaCommentWithAuthor } from "@/lib/types/ideas.types";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import Link from "next/link";
import Image from "next/image";
import ReportButton from "@/components/gallery/report-button";
import { LikeButton } from "@/components/gallery/like-button";
import { CommentSection } from "@/components/idees/comment-section";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FocusedPhotoDetail({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  
  const { id } = await params;
  const photo = await getPhotoById(id);
  
  // Récupérer les commentaires
  const comments = await getPhotoComments(id);
  
  // Vérifier si l'utilisateur a liké
  const { data: likeData } = await supabase
    .from("gallery_likes")
    .select("photo_id")
    .eq("photo_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  
  const initialLiked = !!likeData;
  
  // Vérifier si admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  const isAdmin = profile?.role === "admin";
  
  return (
  <PwaContainer>
      {!photo ? (
        <div className="p-4 text-sm text-muted-foreground">Photo introuvable.</div>
      ) : (
        <div className="space-y-4">
          <section className="mt-1 sm:mt-2">
            <Link href="/galerie" className="text-xs text-muted-foreground hover:text-foreground">← Retour à la galerie</Link>
          </section>
          <div className="rounded-lg overflow-hidden border relative w-full aspect-[4/3]">
            <Image src={photo.image_url} alt={photo.title} fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{photo.title}</h1>
            {photo.description && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{photo.description}</p>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              <span>Catégorie: {photo.category}</span>
              {photo.taken_at && <span className="ml-2">• Prise le {new Date(photo.taken_at).toLocaleDateString("fr-FR")}</span>}
              <span className="ml-2">• Publiée le {new Date(photo.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="mt-3">
              <ReportButton photoId={photo.id} />
            </div>
            
            {/* Bouton Like */}
            <div className="mt-3">
              <LikeButton
                photoId={photo.id}
                initialLiked={initialLiked}
                initialCount={photo.likes_count}
                variant="compact"
              />
            </div>
          </div>
          
          {/* Section Commentaires */}
          <CommentSection
            ideaId={photo.id}
            initialComments={comments.map((c) => ({
              ...c,
              idea_id: c.photo_id, // Map photo_id to idea_id pour compatibilité
            })) as IdeaCommentWithAuthor[]}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onCreateComment={async (content: string) => {
              "use server";
              await createPhotoComment(photo.id, content);
            }}
            onUpdateComment={async (commentId: string, content: string) => {
              "use server";
              await updatePhotoComment(commentId, content);
            }}
            onDeleteComment={async (commentId: string) => {
              "use server";
              await deletePhotoComment(commentId);
            }}
            onFlagComment={async (commentId: string) => {
              "use server";
              await flagPhotoComment(commentId);
            }}
          />
        </div>
      )}
  </PwaContainer>
  );
}
