import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * OPTIMISATION: Loading state pour ma-tournee
 */
export default function MaTourneeLoading() {
  return (
    <>
      <PwaContainer>
        <div className="space-y-4">
          {/* Status card skeleton */}
          <div className="border rounded-lg p-6 space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>

          {/* Secteur badge skeleton */}
          <Skeleton className="h-10 w-32 rounded-full" />

          {/* Action buttons skeleton */}
          <div className="grid grid-cols-1 gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </PwaContainer>

      <PwaContainer>
        <Skeleton className="h-12 w-full rounded-lg" />
      </PwaContainer>
    </>
  )
}
