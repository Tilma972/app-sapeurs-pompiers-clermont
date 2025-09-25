"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Home,
  User,
  Settings,
  Users,
  BarChart3,
  FileText
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

const navigation = [
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Tournées & Calendriers",
    href: "/dashboard/calendriers",
    icon: Calendar,
  },
  {
    name: "Ma Tournée",
    href: "/dashboard/ma-tournee",
    icon: Users,
  },
  {
    name: "Mon Profil",
    href: "/dashboard/profil",
    icon: User,
  },
  {
    name: "Statistiques",
    href: "/dashboard/statistiques",
    icon: BarChart3,
  },
  {
    name: "Rapports",
    href: "/dashboard/rapports",
    icon: FileText,
  },
  {
    name: "Paramètres",
    href: "/dashboard/parametres",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col bg-card border-r border-border", className)}>
      {/* Logo et titre */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Amicale</h1>
            <p className="text-xs text-muted-foreground">Sapeurs-Pompiers</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 px-3",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer avec déconnexion */}
      <div className="p-4 border-t border-border">
        <LogoutButton />
      </div>
    </div>
  );
}
