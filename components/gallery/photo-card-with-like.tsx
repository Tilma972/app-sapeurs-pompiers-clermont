/**
 * PhotoCardWithLike - Card de photo avec interactions (double-tap pour liker)
 * Version simplifiée utilisant PhotoWithInteractions pour la composition
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { PhotoWithInteractions } from "./photo-with-interactions";
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
  return (
    <Link
      href={`/galerie/${photo.id}`}
      className="mb-3 block break-inside-avoid rounded-lg overflow-hidden border bg-card group relative"
    >
      {/* Image avec interactions (double-tap + like button) */}
      <PhotoWithInteractions
        photoId={photo.id}
        initialLiked={initialLiked}
        initialCount={photo.likes_count}
        enableDoubleTap={true}
        showLikeButton={true}
        likeButtonVariant="overlay"
        className="relative w-full aspect-[4/3] bg-muted cursor-pointer"
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
      </PhotoWithInteractions>

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
