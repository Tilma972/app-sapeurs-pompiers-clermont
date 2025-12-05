import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * OPTIMISATION: Loading state universel pour toutes les pages admin
 * Améliore la perception de performance pendant le chargement des données
 * Les sites rapides (Pinterest, DealsLab) affichent TOUJOURS un skeleton
 */
export default function AdminLoading() {
  return (
    <PwaContainer>
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Filters/Actions skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table/Cards skeleton */}
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </PwaContainer>
  )
}
