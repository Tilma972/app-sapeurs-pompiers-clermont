"use client"

import type { ReactNode } from "react"

interface FocusedContainerProps {
  children: ReactNode
}

export function FocusedContainer({ children }: FocusedContainerProps) {
  return (
    <div className="bg-background">
      {/* Reduced vertical padding globally to bring page content closer to the AppBar */}
      <div className="max-w-2xl mx-auto px-4 py-0 space-y-4">
        {children}
      </div>
    </div>
  )
}
