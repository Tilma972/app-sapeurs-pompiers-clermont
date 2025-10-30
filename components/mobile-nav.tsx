"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Camera, Gift, Home, ShoppingBag, Sliders, User, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/logout-button";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: Home },
  { name: "Tournées & Calendriers", href: "/calendriers", icon: Calendar },
  { name: "Petites Annonces", href: "/dashboard/annonces", icon: ShoppingBag },
  { name: "Galerie SP", href: "/dashboard/galerie", icon: Camera },
  { name: "Événements", href: "/dashboard/associative", icon: Calendar },
  { name: "Mon Compte", href: "/dashboard/mon-compte", icon: Wallet },
  { name: "Paramètres", href: "/dashboard/parametres", icon: Sliders },
  { name: "Partenaires & Avantages", href: "/dashboard/partenaires", icon: Gift },
  { name: "Mon Profil", href: "/dashboard/profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (mounted) setRole(profile?.role ?? null);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className="block">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 px-3",
                  isActive
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}

        {role && ["admin", "tresorier"].includes(role) && (
          <div className="pt-4 mt-2 border-t border-border space-y-2">
            <div className="px-2 text-xs uppercase tracking-wide text-muted-foreground">Administration</div>
            {[
              { name: "Vue d'ensemble", href: "/dashboard/admin", icon: Home },
              { name: "Inscriptions en attente", href: "/dashboard/admin/pending", icon: User },
              { name: "Utilisateurs", href: "/dashboard/admin/users", icon: Users },
              { name: "Équipes", href: "/dashboard/admin/equipes", icon: Calendar },
              { name: "Chèques", href: "/dashboard/admin/cheques", icon: Wallet },
              { name: "Reçus fiscaux", href: "/dashboard/admin/receipts", icon: Gift },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className="block">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-10 px-3",
                      isActive
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      <div className="p-3 border-t border-border">
        <LogoutButton />
      </div>
    </div>
  );
}

export default MobileNav;
