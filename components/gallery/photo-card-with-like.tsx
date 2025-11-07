/**
 * PhotoCardWithLike - Card de photo avec double-tap pour liker (style Instagram)
 * Animation Framer Motion pour le coeur géant avec effet rebond
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LikeButton } from "./like-button";
import { Badge } from "@/components/ui/badge";
import { usePhotoLike } from "@/hooks/use-photo-like";

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
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Hook centralisé pour gérer les likes
  const { liked, count, toggleLike } = usePhotoLike({
    photoId: photo.id,
    initialLiked,
    initialCount: photo.likes_count,
  });

  useEffect(() => {
    const currentTimeout = timeoutRef.current;
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
    };
  }, []);

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
      
      timeoutRef.current = setTimeout(() => setShowBigHeart(false), 1200);

      // Utiliser la fonction centralisée toggleLike
      await toggleLike();
    }
    setLastTap(now);
  };

  // Wrapper pour le bouton like
  const handleLikeClick = () => {
    toggleLike().catch(console.error);
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

        {/* Coeur géant animation (style Instagram) avec Framer Motion */}
        <AnimatePresence>
          {showBigHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: [0, 10, 0]
                }}
                exit={{ 
                  scale: 0,
                  opacity: 0 
                }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1] // easeOutBack pour effet "rebond"
                }}
                style={{
                  willChange: "transform, opacity"
                }}
              >
                <Heart className="w-28 h-28 fill-white text-white drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton like (visible au hover sur desktop, toujours visible sur mobile) */}
        <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
          <LikeButton
            liked={liked}
            onToggle={handleLikeClick}
            variant="overlay"
          />
        </div>
      </div>

      {/* Titre et description */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium line-clamp-2 flex-1">{photo.title}</div>
          {/* Indicateur de likes (toujours visible) - FIX: utiliser count (state) au lieu de photo.likes_count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{count}</span>
          </div>
        </div>
        {photo.description && (
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {photo.description}
          </div>
        )}
      </div>
    </Link>
  );
}
