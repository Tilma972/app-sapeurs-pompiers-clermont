/**
 * Hook personnalisé pour gérer les likes de photos de manière cohérente
 * Utilisé à la fois dans la galerie et sur les pages détails
 */

"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

interface UsePhotoLikeProps {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
}

interface UsePhotoLikeReturn {
  liked: boolean;
  count: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
}

export function usePhotoLike({
  photoId,
  initialLiked,
  initialCount,
}: UsePhotoLikeProps): UsePhotoLikeReturn {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = useCallback(async () => {
    if (isLoading) return;

    const previousLiked = liked;
    const previousCount = count;

    // Optimistic update
    const newLiked = !liked;
    const newCount = count + (newLiked ? 1 : -1);
    
    setLiked(newLiked);
    setCount(newCount);
    setIsLoading(true);

    try {
      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors du like");
      }

      const { liked: serverLiked, count: serverCount } = await res.json();

      // Sync avec le serveur
      setLiked(serverLiked);
      setCount(serverCount);
    } catch (error) {
      // Revert en cas d'erreur
      setLiked(previousLiked);
      setCount(previousCount);
      
      const message = error instanceof Error ? error.message : "Erreur lors du like";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [photoId, liked, count, isLoading]);

  return {
    liked,
    count,
    isLoading,
    toggleLike,
  };
}
