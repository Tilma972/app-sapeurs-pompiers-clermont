/**
 * PhotoCardWithLike - Card de photo avec double-tap pour liker (style Instagram)
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { LikeButton } from "./like-button";
import { Badge } from "@/components/ui/badge";

interface PhotoCardWithLikeProps {
  photo: {
    id: string;
    image_url: string;
    thumbnail_url: string | null;
    title: string;
    description: string | null;
    category: string;
    likes_count: number;
  };
  initialLiked: boolean;
}

export function PhotoCardWithLike({ photo, initialLiked }: PhotoCardWithLikeProps) {
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [liked, setLiked] = useState(initialLiked);

  const handleDoubleTap = async (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap détecté !
      e.preventDefault();
      e.stopPropagation();

      if (liked) {
        // Déjà liké, ne rien faire
        return;
      }

      // Animation coeur géant
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 1000);

      // Optimistic update
      setLiked(true);

      // Trigger API
      try {
        await fetch("/api/gallery/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_id: photo.id }),
        });
      } catch (error) {
        console.error("Error liking photo:", error);
        setLiked(false);
      }
    }
    setLastTap(now);
  };

  return (
    <Link
      href={`/galerie/${photo.id}`}
      className="mb-3 block break-inside-avoid rounded-lg overflow-hidden border bg-card group relative"
    >
      {/* Image avec double-tap */}
      <div
        className="relative w-full aspect-[4/3] bg-muted cursor-pointer"
        onClick={handleDoubleTap}
      >
        <Image
          src={photo.thumbnail_url || photo.image_url}
          alt={photo.title}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="transition-transform group-hover:scale-105 duration-300"
        />

        {/* Badge catégorie */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            {photo.category}
          </Badge>
        </div>

        {/* Coeur géant animation (style Instagram) */}
        {showBigHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl animate-[ping_0.8s_ease-out]" />
          </div>
        )}

        {/* Bouton like (visible au hover) */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <LikeButton
            photoId={photo.id}
            initialLiked={liked}
            initialCount={photo.likes_count}
            variant="overlay"
          />
        </div>
      </div>

      {/* Titre et description */}
      <div className="px-2 py-2">
        <div className="text-sm font-medium line-clamp-2">{photo.title}</div>
        {photo.description && (
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {photo.description}
          </div>
        )}
      </div>
    </Link>
  );
}
