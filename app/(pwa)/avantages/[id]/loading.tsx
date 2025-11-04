/**
 * Loading state pour la page détail d'offre
 * Skeleton loaders pour hero, cards, partner info
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function OfferDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" disabled className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>

      {/* Hero Image Skeleton */}
      <Skeleton className="aspect-[16/9] md:aspect-[21/9] w-full" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titre et badges skeleton */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-3/4 mb-3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>

            {/* QR/Code card skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Skeleton className="h-48 w-48 rounded-lg" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </CardContent>
            </Card>

            {/* Conditions skeleton */}
            <Card>
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Période skeleton */}
            <Card>
              <CardContent className="py-4 px-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Partner info skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-16 w-16 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />

                <div className="space-y-3 pt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 mt-0.5 shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
