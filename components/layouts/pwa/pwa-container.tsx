import type { ReactNode } from "react"

interface PwaContainerProps {
  children: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function PwaContainer({ 
  children, 
  maxWidth = "2xl" // Défaut actuel
}: PwaContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",    // 384px - Formulaires très étroits
    md: "max-w-md",    // 448px - Formulaires standards
    lg: "max-w-lg",    // 512px - Contenu moyen
    xl: "max-w-xl",    // 576px - Contenu large
    "2xl": "max-w-2xl", // 672px - Défaut actuel
    full: "max-w-full"  // 100% - Grilles, galeries
  }

  return (
    <div className="bg-background">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 pt-0 pb-4 space-y-2`}>
        {children}
      </div>
    </div>
  )
}
