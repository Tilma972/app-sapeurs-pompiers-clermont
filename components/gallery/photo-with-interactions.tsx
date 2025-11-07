/**
 * PhotoWithInteractions - Wrapper pour gérer le double-tap style Instagram
 * Composition component qui utilise LikeButton en interne
 * Version production-ready avec React best practices 2025
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LikeButton } from "./like-button";

interface PhotoWithInteractionsProps {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
  children: React.ReactNode;
  enableDoubleTap?: boolean;
  showLikeButton?: boolean;
  likeButtonVariant?: "compact" | "overlay";
  className?: string;
}

export function PhotoWithInteractions({
  photoId,
  initialLiked,
  initialCount,
  children,
  enableDoubleTap = true,
  showLikeButton = true,
  likeButtonVariant = "overlay",
  className = "",
}: PhotoWithInteractionsProps) {
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 🔥 AMÉLIORATION 2: Sync avec les props initiales
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 🔥 AMÉLIORATION 1: useCallback pour handleLikeChange
  const handleLikeChange = useCallback((newLiked: boolean, newCount: number) => {
    setLiked(newLiked);
    setCount(newCount);
  }, []);

  // 🔥 AMÉLIORATION 1: useCallback pour handleDoubleTap
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    if (!enableDoubleTap) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap détecté !
      e.preventDefault();
      e.stopPropagation();

      if (liked) {
        // Déjà liké, ne rien faire (UX Instagram)
        return;
      }

      const previousLiked = liked;
      const previousCount = count;

      // Optimistic update + animation coeur géant
      setShowBigHeart(true);
      setLiked(true);
      setCount(count + 1);

      timeoutRef.current = setTimeout(() => setShowBigHeart(false), 1000);

      // API call
      fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("API error");
          return res.json();
        })
        .then(({ liked: serverLiked, count: serverCount }) => {
          // Sync avec serveur
          setLiked(serverLiked);
          setCount(serverCount);
        })
        .catch((error) => {
          // 🔥 AMÉLIORATION 3: Rollback complet
          console.error("Double-tap like error:", error);
          setLiked(previousLiked);
          setCount(previousCount);
          setShowBigHeart(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        });
    }

    setLastTap(now);
  }, [enableDoubleTap, liked, count, lastTap, photoId]);

  return (
    <div className={`relative ${className}`} onClick={handleDoubleTap}>
      {/* Contenu (image) */}
      {children}

      {/* Animation coeur géant (style Instagram) avec Framer Motion */}
      <AnimatePresence>
        {showBigHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
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
      {showLikeButton && (
        <div className="absolute bottom-2 right-2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <LikeButton
            photoId={photoId}
            initialLiked={liked}
            initialCount={count}
            variant={likeButtonVariant}
            onLikeChange={handleLikeChange}
          />
        </div>
      )}
    </div>
  );
}
