"use client"

import type { ReactNode } from "react"

interface FocusedContainerProps {
  children: ReactNode
}

export function FocusedContainer({ children }: FocusedContainerProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {children}
      </div>
    </div>
  )
}
