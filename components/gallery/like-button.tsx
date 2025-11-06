/**
 * Composant LikeButton - Bouton like avec animation
 * Supporte 2 variants : compact (grille) et overlay (sur photo)
 */

"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
  variant?: "compact" | "overlay";
  className?: string;
}

export function LikeButton({
  photoId,
  initialLiked,
  initialCount,
  variant = "compact",
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    const newLiked = !liked;
    const previousLiked = liked;
    const previousCount = count;

    // Optimistic update
    setLiked(newLiked);
    setCount(count + (newLiked ? 1 : -1));

    // Animation si nouveau like
    if (newLiked) {
      setIsAnimating(true);
      setParticles(Array.from({ length: 6 }, (_, i) => i));
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 600);
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur");
      }

      const { liked: serverLiked, count: serverCount } = await res.json();
      
      // Sync avec serveur
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
  };

  // Variant overlay (bouton flottant sur la photo)
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
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-200",
              liked && "fill-current",
              isAnimating && "scale-125"
            )}
          />
          <span className="text-xs font-semibold">{count}</span>
        </button>

        {/* Particules animées */}
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
            }}
          />
        ))}
      </div>
    );
  }

  // Variant compact (bouton dans la grille)
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg",
        "border transition-all duration-200 disabled:opacity-50",
        liked
          ? "bg-red-50 border-red-500 text-red-600"
          : "bg-background border-border hover:border-red-300",
        className
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-transform duration-200",
          liked && "fill-current scale-110"
        )}
      />
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}
