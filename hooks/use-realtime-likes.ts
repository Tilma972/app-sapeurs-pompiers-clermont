/**
 * Hook pour synchroniser les likes en temps réel via Supabase Realtime
 * Écoute les changements sur gallery_likes pour une photo spécifique
 */

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeLikesOptions {
  photoId: string;
  onLikeCountChange: (newCount: number, userLiked: boolean) => void;
  enabled?: boolean;
}

export function useRealtimeLikes({
  photoId,
  onLikeCountChange,
  enabled = true,
}: UseRealtimeLikesOptions) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Créer un channel unique pour cette photo
    const channel = supabase
      .channel(`photo_likes:${photoId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "gallery_likes",
          filter: `photo_id=eq.${photoId}`,
        },
        async () => {
          console.log("🔄 [Realtime] Change detected for photo:", photoId);

          // Récupérer le user actuel
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            console.warn("⚠️ [Realtime] No user, skipping update");
            return;
          }

          // Compter TOUS les likes de la photo
          const { count } = await supabase
            .from("gallery_likes")
            .select("*", { count: "exact", head: true })
            .eq("photo_id", photoId);

          // Vérifier si l'utilisateur ACTUEL a liké cette photo
          const { data: userLike } = await supabase
            .from("gallery_likes")
            .select("photo_id")
            .eq("photo_id", photoId)
            .eq("user_id", user.id)
            .maybeSingle();

          const userLiked = !!userLike;

          console.log("🔄 [Realtime] Update:", {
            photoId,
            count: count || 0,
            userLiked,
          });

          if (count !== null) {
            onLikeCountChange(count, userLiked);
          }
        }
      )
      .subscribe();

    // Cleanup lors du démontage
    return () => {
      channel.unsubscribe();
    };
  }, [photoId, onLikeCountChange, enabled]);
}
