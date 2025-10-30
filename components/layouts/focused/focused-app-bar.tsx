"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Menu, Settings, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import MobileNav from "@/components/mobile-nav"
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

export function FocusedAppBar({ title, user }: FocusedAppBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getPageTitle = () => {
    if (title) return title
    // Titre dynamique basé sur la route
    if (pathname === "/dashboard" || pathname === "/dashboard/") return "Tableau de bord"
    if (pathname?.startsWith("/ma-tournee")) return "Ma Tournée"
    if (pathname?.startsWith("/calendriers")) return "Calendriers"
    if (pathname?.startsWith("/dashboard/annonces")) return "Petites Annonces"
    if (pathname?.startsWith("/galerie")) return "Galerie SP"
    if (pathname?.startsWith("/dashboard/associative")) return "Événements"
    if (pathname?.startsWith("/mon-compte")) return "Mon Compte"
    if (pathname?.startsWith("/profil")) return "Mon Profil"
    if (pathname?.startsWith("/dashboard/parametres")) return "Paramètres"
    if (pathname?.startsWith("/dashboard/partenaires")) return "Partenaires"
    return "Amicale SP"
  }

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Hamburger menu for navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 sm:w-96" aria-describedby={undefined}>
            <div className="h-16 flex items-center px-4 border-b border-border">
              <SheetHeader className="p-0">
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
            </div>
            <MobileNav />
          </SheetContent>
        </Sheet>

        <h1 className="text-base font-semibold truncate max-w-[60%] text-center">
          {getPageTitle()}
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
