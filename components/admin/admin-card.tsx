import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminCardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  actions?: ReactNode
}

/**
 * Card wrapper avec style cohérent pour les sections admin
 */
export function AdminCard({ children, className, title, description, actions }: AdminCardProps) {
  return (
    <Card className={cn("p-4 sm:p-6", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </Card>
  )
}

/**
 * Card simple pour afficher des items en liste (mobile-friendly)
 */
export function AdminListCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors", className)}>
      {children}
    </div>
  )
}
