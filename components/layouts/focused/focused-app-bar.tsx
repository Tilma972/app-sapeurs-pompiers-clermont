"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, LogOut, Settings, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface FocusedAppBarProps {
  title?: string
  user: {
    avatar_url?: string
    initials: string
    full_name?: string
    email?: string
  }
}

export function FocusedAppBar({ title = "Ma Tournée", user }: FocusedAppBarProps) {
  const router = useRouter()

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="flex items-center justify-between h-16 px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
          <ChevronLeft />
        </Button>

        <h1 className="text-base font-semibold truncate max-w-[60%] text-center">
          {title}
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Menu utilisateur" className="rounded-full outline-none focus:ring-2 focus:ring-ring">
              <Avatar>
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">
              {user.full_name || "Profil"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/profil">
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/parametres">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
