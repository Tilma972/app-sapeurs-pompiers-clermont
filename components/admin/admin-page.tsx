import { ReactNode } from "react"

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function AdminContent({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function AdminSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
