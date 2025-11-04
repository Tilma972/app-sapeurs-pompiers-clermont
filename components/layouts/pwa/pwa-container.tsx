import type { ReactNode } from "react"

interface PwaContainerProps {
  children: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  noPaddingTop?: boolean // Option pour désactiver le padding-top (ex: dashboard avec hero)
}

export function PwaContainer({ 
  children, 
  maxWidth = "2xl",
  noPaddingTop = false
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
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 ${noPaddingTop ? 'pt-0' : 'pt-6'} pb-4 space-y-4`}>
        {children}
      </div>
    </div>
  )
}
