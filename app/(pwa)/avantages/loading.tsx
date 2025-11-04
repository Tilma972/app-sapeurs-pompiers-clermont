/**
 * Loading state pour la page Avantages
 * Skeleton loaders pour featured carousel, filtres, et grille
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Gift } from 'lucide-react';

/**
 * Skeleton pour une carte d'offre
 */
function OfferCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-video w-full" />

      <CardContent className="p-4">
        {/* Badge skeleton */}
        <Skeleton className="h-6 w-24 mb-2" />

        {/* Title skeleton */}
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />

        {/* Partner info skeleton */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Description skeleton */}
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

/**
 * Skeleton pour le carousel featured
 */
function FeaturedCarouselSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image skeleton */}
          <Skeleton className="aspect-video md:aspect-square w-full" />

          {/* Content skeleton */}
          <CardContent className="p-6 flex flex-col justify-center">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-3" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-5 w-24 mb-4" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </div>
      </Card>

      {/* Dots skeleton */}
      <div className="flex justify-center gap-2 mt-4">
        <Skeleton className="h-2 w-8 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour les filtres
 */
function FiltersSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      {/* Search skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Categories skeleton */}
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Types skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function AvantagesLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8 text-muted-foreground animate-pulse" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Featured Carousel Skeleton */}
      <FeaturedCarouselSkeleton />

      {/* Filters Skeleton */}
      <FiltersSkeleton />

      {/* Results count skeleton */}
      <Skeleton className="h-4 w-32 mb-4" />

      {/* Offers Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
