import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * OPTIMISATION: Loading state pour le dashboard
 * Améliore la perception de performance
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col -mt-14">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-48 rounded-none" />

      {/* Content */}
      <PwaContainer>
        <div className="space-y-5 pt-6">
          {/* Progression bar skeleton */}
          <div className="border rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-2 w-full" />
          </div>

          {/* Bento grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </PwaContainer>
    </div>
  )
}
