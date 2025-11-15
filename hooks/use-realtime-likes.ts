/**
 * Hook pour synchroniser les likes en temps réel via Supabase Realtime
 * Écoute les changements sur gallery_likes pour une photo spécifique
 */

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeLikesOptions {
  photoId: string;
  onLikeCountChange: (newCount: number) => void;
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
          // Quand un changement est détecté, recalculer le nombre de likes
          const { count } = await supabase
            .from("gallery_likes")
            .select("*", { count: "exact", head: true })
            .eq("photo_id", photoId);

          if (count !== null) {
            onLikeCountChange(count);
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
