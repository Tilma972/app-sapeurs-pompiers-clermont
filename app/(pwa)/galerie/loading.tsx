import { Skeleton } from "@/components/ui/skeleton";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";

export default function GalerieLoading() {
  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* En-tête */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>

        {/* Grille d'images */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>

        {/* Bouton charger plus */}
        <Skeleton className="h-10 w-full" />
      </div>
    </PwaContainer>
  );
}
