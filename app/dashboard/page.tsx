import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getGlobalStats } from "@/lib/supabase/tournee";
import { 
  Calendar, 
  ShoppingBag, 
  Camera, 
  Gift, 
  Wallet,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import { TourneeStatsCard } from "@/components/tournee-stats-card";


export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Récupération du profil utilisateur et des statistiques globales
  const profile = await getCurrentUserProfile();
  const globalStats = await getGlobalStats();

  // Structure de données pour les cartes du menu - Style moderne shadcn/ui
  const menuItems = [
    {
      title: "Petites Annonces",
      description: "Annonces actives",
      icon: ShoppingBag,
      href: "/dashboard/annonces",
      value: "12",
      trend: "+3",
      trendType: "positive",
      footerText: "Nouvelles cette semaine"
    },
    {
      title: "Galerie SP",
      description: "Photos partagées",
      icon: Camera,
      href: "/dashboard/galerie",
      value: "156",
      trend: "+7",
      trendType: "positive",
      footerText: "Dernière photo il y a 2h"
    },
    {
      title: "Annonces & Événements",
      description: "Prêts en cours",
      icon: Calendar,
      href: "/dashboard/associative",
      value: "5",
      trend: "stable",
      trendType: "neutral",
      footerText: "Prochain événement dans 5j"
    },
    {
      title: "Mon Profil",
      description: "Informations personnelles",
      icon: Wallet,
      href: "/dashboard/profil",
      value: profile?.full_name ? "Complet" : "Incomplet",
      trend: profile?.full_name ? "à jour" : "manquant",
      trendType: profile?.full_name ? "positive" : "negative",
      footerText: `Rôle: ${profile?.role || "membre"}`
    },
    {
      title: "Partenaires & Avantages",
      description: "Offres disponibles",
      icon: Gift,
      href: "/dashboard/partenaires",
      value: "12",
      trend: "+2",
      trendType: "positive",
      footerText: "8 partenaires locaux"
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bonjour, {profile?.full_name || user.email?.split('@')[0] || 'Utilisateur'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue sur votre tableau de bord - {profile?.role || 'Membre'}
            </p>
          </div>
          <div className="hidden sm:block">
            <Badge variant="outline" className="bg-background/50">
              🔥 Amicale SP Clermont l&apos;Hérault
            </Badge>
          </div>
        </div>
      </div>

      {/* Grille des cartes de navigation - Style moderne shadcn/ui */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Carte Tournées & Calendriers dynamique */}
          <Link href="/dashboard/calendriers" className="group">
            <TourneeStatsCard globalStats={globalStats} />
          </Link>
          
          {menuItems.map((item) => {
            const TrendIcon = item.trendType === "positive" ? TrendingUp : 
                             item.trendType === "negative" ? TrendingDown : null;
            
            return (
              <Link key={item.title} href={item.href} className="group">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader>
                    <CardDescription>{item.description}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {item.value}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline" className={
                        item.trendType === "positive" 
                          ? "text-green-600 border-green-200" 
                          : item.trendType === "negative"
                          ? "text-red-600 border-red-200"
                          : "text-muted-foreground"
                      }>
                        {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                        {item.trend}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      {item.title}
                    </div>
                    <div className="text-muted-foreground">
                      {item.footerText}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Section d'information en bas */}
        <div className="mt-12 text-center">
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg">
            <p className="text-muted-foreground text-sm">
              🔥 Application développée pour l&apos;Amicale des Sapeurs-Pompiers • 
              <span className="font-medium text-foreground"> Version 1.0</span>
            </p>
          </div>
        </div>
    </div>
  );
}
