"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Home,
  User,
  ShoppingBag,
  Camera,
  Gift,
  Wallet,
  Sliders,
  Users,
  ChevronDown,
  LayoutDashboard,
  Image as ImageIcon,
  Megaphone,
  FileText,
  UserCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: Home },
  { name: "Tournées & Calendriers", href: "/dashboard/calendriers", icon: Calendar },
  { name: "Petites Annonces", href: "/dashboard/annonces", icon: ShoppingBag },
  { name: "Galerie SP", href: "/dashboard/galerie", icon: Camera },
  { name: "Événements", href: "/dashboard/associative", icon: Calendar },
  { name: "Mon Compte", href: "/dashboard/mon-compte", icon: Wallet },
  { name: "Paramètres", href: "/dashboard/parametres", icon: Sliders },
  { name: "Partenaires & Avantages", href: "/dashboard/partenaires", icon: Gift },
  { name: "Mon Profil", href: "/dashboard/profil", icon: User },
];

const adminNavigation = {
  general: [
    { name: "Vue d'ensemble", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Inscriptions en attente", href: "/dashboard/admin/pending", icon: User },
    { name: "Liste blanche", href: "/dashboard/admin/whitelist", icon: UserCheck },
    { name: "Utilisateurs", href: "/dashboard/admin/users", icon: Users },
  ],
  boutique: [
    { name: "Produits", href: "/dashboard/produits", icon: ShoppingBag },
    { name: "Commandes", href: "/dashboard/admin/commandes", icon: FileText },
  ],
  landingPage: [
    { name: "Partenaires", href: "/dashboard/admin/partenaires", icon: Gift },
    { name: "Galerie Photos", href: "/dashboard/admin/galerie-landing", icon: ImageIcon },
    { name: "Annonces", href: "/dashboard/admin/annonces-landing", icon: Megaphone },
  ],
  organisation: [
    { name: "Équipes", href: "/dashboard/admin/equipes", icon: Calendar },
    { name: "Avantages", href: "/dashboard/admin/avantages", icon: Gift },
    { name: "Chèques", href: "/dashboard/admin/cheques", icon: Wallet },
    { name: "Reçus fiscaux", href: "/dashboard/admin/receipts", icon: FileText },
  ],
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (mounted && data) {
        setRole(data.role);
      }
    };

    fetchRole();

    return () => {
      mounted = false;
    };
  }, []);

  const NavList = () => (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10 px-3 transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}

      {role && ["admin", "tresorier"].includes(role) && (
        <div className="pt-4 mt-2 border-t border-border">
          <div className="px-2 mb-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Administration
          </div>

          {/* Général */}
          <Collapsible defaultOpen className="space-y-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center">
                  <LayoutDashboard className="mr-3 h-4 w-4" />
                  <span>Général</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              {adminNavigation.general.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-3 transition-colors text-sm",
                        isActive
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-3.5 w-3.5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Boutique */}
          <Collapsible className="space-y-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center">
                  <ShoppingBag className="mr-3 h-4 w-4" />
                  <span>Boutique</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              {adminNavigation.boutique.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-3 transition-colors text-sm",
                        isActive
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-3.5 w-3.5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Landing Page */}
          <Collapsible className="space-y-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center">
                  <Home className="mr-3 h-4 w-4" />
                  <span>Page d&apos;accueil</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              {adminNavigation.landingPage.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-3 transition-colors text-sm",
                        isActive
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-3.5 w-3.5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Organisation */}
          <Collapsible className="space-y-1">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-center">
                  <Users className="mr-3 h-4 w-4" />
                  <span>Organisation</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6">
              {adminNavigation.organisation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-3 transition-colors text-sm",
                        isActive
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-3 h-3.5 w-3.5" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </nav>
  );

  return (
    <div className={cn("flex h-full flex-col bg-card border-r border-border", className)}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Amicale</h1>
            <p className="text-xs text-muted-foreground">Sapeurs-Pompiers</p>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
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
              <NavList />
              <div className="p-4 border-t border-border">
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop nav */}
      <div className="hidden sm:flex flex-1 flex-col">
        <NavList />
        <div className="p-4 border-t border-border mt-auto">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
