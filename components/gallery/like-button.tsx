/**
 * LikeButton - Bouton de like avec animations et gestion d'état optimisée
 * Version production-ready avec React best practices 2025
 */

"use client";

import { Heart, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useRealtimeLikes } from "@/hooks/use-realtime-likes";

interface LikeButtonProps {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
  variant?: "compact" | "overlay";
  className?: string;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({
  photoId,
  initialLiked,
  initialCount,
  variant = "compact",
  className,
  onLikeChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 AMÉLIORATION 2: Sync avec props initiales (fix sync galerie ↔ détail)
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  // 🔥 NOUVEAU: Synchronisation temps réel via Supabase Realtime
  const handleRealtimeCountChange = useCallback((newCount: number) => {
    setCount(newCount);
    onLikeChange?.(liked, newCount);
  }, [liked, onLikeChange]);

  useRealtimeLikes({
    photoId,
    onLikeCountChange: handleRealtimeCountChange,
    enabled: true,
  });

  // 🔥 AMÉLIORATION 1: useCallback pour éviter re-renders inutiles
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    const newLiked = !liked;
    const previousLiked = liked;
    const previousCount = count;

    // Optimistic update
    setLiked(newLiked);
    setCount(count + (newLiked ? 1 : -1));

    // Animation particules si nouveau like
    if (newLiked && variant === "overlay") {
      setIsAnimating(true);
      setParticles(Array.from({ length: 6 }, (_, i) => i));
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 600);
    }

    setIsLoading(true);

    try {
      console.log("🔵 [LikeButton] Sending like request for photo:", photoId);

      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
        credentials: "include",
      });

      console.log("🔵 [LikeButton] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ [LikeButton] Error response:", error);
        throw new Error(error.error || "Erreur lors du like");
      }

      const { liked: serverLiked, count: serverCount } = await res.json();
      console.log("✅ [LikeButton] Success:", { serverLiked, serverCount });

      // Sync avec serveur
      setLiked(serverLiked);
      setCount(serverCount);

      // Notifier le parent du changement
      onLikeChange?.(serverLiked, serverCount);

    } catch (error) {
      // 🔥 AMÉLIORATION 3: Rollback complet en cas d'erreur
      setLiked(previousLiked);
      setCount(previousCount);
      setIsAnimating(false);
      setParticles([]);

      const message = error instanceof Error ? error.message : "Erreur lors du like";
      toast.error(message);

      // Notifier le parent du rollback
      onLikeChange?.(previousLiked, previousCount);

    } finally {
      setIsLoading(false);
    }
  }, [isLoading, liked, count, photoId, variant, onLikeChange]);

  // Variant overlay (bouton flottant sur la photo avec particules)
  if (variant === "overlay") {
    return (
      <div className={cn("relative inline-block", className)}>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
            "backdrop-blur-sm transition-all duration-200",
            "shadow-lg disabled:opacity-50",
            liked
              ? "bg-red-500/90 text-white scale-105"
              : "bg-white/90 text-gray-700 hover:bg-white hover:scale-105"
          )}
        >
          {/* 🔥 AMÉLIORATION 5: Indicateur de chargement visuel */}
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked && "fill-current",
                isAnimating && "scale-125"
              )}
            />
          )}
          <span className="text-xs font-semibold">{count}</span>
        </button>

        {/* Particules animées (style Instagram) */}
        {particles.map((i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-ping pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: `rotate(${i * 60}deg) translateY(-24px)`,
              animationDelay: `${i * 50}ms`,
              animationDuration: "600ms",
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    );
  }

  // Variant compact (pour page détail)
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "border transition-all duration-200 disabled:opacity-50",
        liked
          ? "bg-red-50 border-red-500 text-red-600"
          : "bg-background border-border hover:border-red-300",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            liked && "fill-current scale-110"
          )}
        />
      )}
      <span className="text-sm font-medium">{count}</span>
    </button>
  );
}
