"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface FocusedHeaderProps {
  title?: string
  user: {
    avatar_url?: string
    initials: string
  }
}

export function FocusedHeader({ title = "Ma Tournée", user }: FocusedHeaderProps) {
  const router = useRouter()
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        
        <h1 className="hidden sm:block text-lg font-semibold">
          {title}
        </h1>
        
        <Avatar>
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
