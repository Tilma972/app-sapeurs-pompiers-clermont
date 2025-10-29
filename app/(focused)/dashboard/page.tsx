import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getGlobalStats } from "@/lib/supabase/tournee";
import { FeatureCard, type Feature } from "@/components/feature-card";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { PersonalStatsCard } from "@/components/personal-stats-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentUserProfile();
  const globalStats = await getGlobalStats();

  // Données mock pour la carte personnelle (à remplacer par vos vraies données)
  const personalStats = {
    calendarsRemaining: 12,
    totalAmountCollected: 933,
    averagePerCalendar: 18.6,
    userHistory: [],
  };

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
      <div className="space-y-4">
        {/* Message compact */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-3 text-white">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">Bienvenue</div>
            <div className="text-xs opacity-90 truncate">{profile?.full_name || user.email?.split("@")[0] || "Membre"}</div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/25">Actif</Badge>
        </div>

        {/* Stats personnelles */}
        <PersonalStatsCard {...personalStats} />

        {/* Grid features plus compacte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </FocusedContainer>
  );
}
