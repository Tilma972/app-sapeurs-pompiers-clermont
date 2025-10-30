"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home, User, LayoutDashboard } from "lucide-react"
import type { ElementType } from "react"

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 px-3 rounded-md transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  )
}

export function FocusedBottomNav() {
  const pathname = usePathname()
  const isActive = (p: string) => pathname === p

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden pb-safe">
      <div className="mx-auto max-w-2xl px-4">
        <div className="grid grid-cols-4 h-16 items-center gap-2">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} active={isActive("/dashboard")} />
          <NavItem href="/calendriers" label="Calendriers" icon={CalendarDays} active={isActive("/calendriers")} />
          <NavItem href="/ma-tournee" label="Ma tournée" icon={Home} active={isActive("/ma-tournee")} />
          <NavItem href="/dashboard/profil" label="Profil" icon={User} active={isActive("/dashboard/profil")} />
        </div>
      </div>
    </nav>
  )
}
