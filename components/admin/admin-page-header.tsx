import { ReactNode } from "react"

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  icon?: ReactNode
}

export function AdminPageHeader({ title, description, actions, icon }: AdminPageHeaderProps) {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
          </div>
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
    </div>
  )
}
