import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getGlobalStats } from "@/lib/supabase/tournee";
import { FeatureCard, type Feature } from "@/components/feature-card";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";


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

  // Nouvelles feature cards modernes (gradients, badges, stats)
  const features: Feature[] = [
    {
      title: "Tournées & Calendriers",
      description: "Suivez la collecte et les distributions",
      iconKey: "calendar",
      href: "/calendriers",
      gradient: "from-sky-500 to-blue-600",
      badges: [
        `${(globalStats?.total_calendriers_distribues ?? 0).toLocaleString("fr-FR")} calendriers`,
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
          .format(globalStats?.total_montant_collecte ?? 0)
      ],
    },
    {
      title: "Petites Annonces",
      description: "Publiez et consultez entre membres",
      iconKey: "shopping-bag",
      href: "/dashboard/annonces",
      gradient: "from-green-500 to-emerald-600",
      badges: ["Mock: 12 annonces"],
    },
    {
      title: "Galerie SP",
      description: "Partagez les moments forts du centre",
      iconKey: "camera",
      href: "/dashboard/galerie",
      gradient: "from-amber-500 to-orange-600",
      badges: ["Mock: 156 photos"],
    },
    {
      title: "Événements",
      description: "Annonces et vie associative",
      iconKey: "calendar",
      href: "/dashboard/associative",
      gradient: "from-rose-500 to-red-600",
      badges: ["Mock: 5 à venir"],
    },
    {
      title: "Mon Compte SP",
      description: "Portefeuille et demandes de paiement",
      iconKey: "wallet",
      href: "/dashboard/mon-compte",
      gradient: "from-slate-500 to-gray-600",
      badges: [profile?.full_name ? "Profil complet" : "Profil incomplet"],
    },
    {
      title: "Partenaires & Avantages",
      description: "Catalogue d'offres locales",
      iconKey: "gift",
      href: "/dashboard/partenaires",
      gradient: "from-purple-500 to-fuchsia-600",
      badges: ["Mock: 8 offres"],
    },
  ];

  return (
    <FocusedContainer>
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

      {/* Grille des features modernes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {features.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
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
    </FocusedContainer>
  );
}
