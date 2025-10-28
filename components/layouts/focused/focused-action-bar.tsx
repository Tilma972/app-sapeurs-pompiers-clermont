"use client"

import type { ReactNode } from "react"

interface FocusedActionBarProps {
  children: ReactNode
}

export function FocusedActionBar({ children }: FocusedActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 border-t border-border shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
