"use client"

import type { ReactNode } from "react"

interface FocusedContainerProps {
  children: ReactNode
}

export function FocusedContainer({ children }: FocusedContainerProps) {
  return (
    <div className="bg-background">
      {/* Reduced vertical padding globally to bring page content closer to the AppBar */}
      <div className="max-w-2xl mx-auto px-4 pt-0 pb-4 space-y-2">
        {children}
      </div>
    </div>
  )
}
