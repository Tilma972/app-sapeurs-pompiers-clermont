/**
 * FavoriteButton - Composant pour ajouter/retirer une annonce des favoris
 * Avec Optimistic UI et toggle
 */

"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavoriteAction } from "@/app/annonces/actions";
import toast from "react-hot-toast";

interface FavoriteButtonProps {
  annonceId: string;
  initialIsFavorite: boolean;
  initialFavoritesCount: number;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showCount?: boolean;
  className?: string;
  onFavoriteChange?: (isFavorite: boolean, newCount: number) => void;
}

export function FavoriteButton({
  annonceId,
  initialIsFavorite,
  initialFavoritesCount,
  variant = "ghost",
  size = "icon",
  showCount = false,
  className,
  onFavoriteChange,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);
  const [loading, setLoading] = useState(false);

  const handleToggleFavorite = async () => {
    if (loading) return;

    // Optimistic UI - Sauvegarder l'état précédent pour rollback
    const previousIsFavorite = isFavorite;
    const previousCount = favoritesCount;

    try {
      setLoading(true);

      // Mise à jour optimiste immédiate
      const newIsFavorite = !isFavorite;
      const newCount = newIsFavorite ? previousCount + 1 : previousCount - 1;

      setIsFavorite(newIsFavorite);
      setFavoritesCount(newCount);
      onFavoriteChange?.(newIsFavorite, newCount);

      // Appel Server Action
      const result = await toggleFavoriteAction(annonceId);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la modification des favoris");
      }

      // Toast de succès
      toast.success(
        result.action === "added"
          ? "Ajouté aux favoris ❤️"
          : "Retiré des favoris"
      );

    } catch (error: unknown) {
      // Rollback optimistic UI en cas d'erreur
      setIsFavorite(previousIsFavorite);
      setFavoritesCount(previousCount);
      onFavoriteChange?.(previousIsFavorite, previousCount);

      console.error("Erreur toggle favorite:", error);
      toast.error("Impossible de modifier les favoris. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={loading}
      className={cn(
        showCount && "gap-2",
        className
      )}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "h-5 w-5 transition-colors",
            isFavorite && "fill-red-500 text-red-500"
          )}
        />
      )}
      {showCount && (
        <span className="text-sm font-medium">
          {favoritesCount}
        </span>
      )}
    </Button>
  );
}
