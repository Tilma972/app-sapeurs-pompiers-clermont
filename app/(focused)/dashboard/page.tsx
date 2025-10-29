import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getGlobalStats } from "@/lib/supabase/tournee";
import { FeatureCard, type Feature } from "@/components/feature-card";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentUserProfile();
  const globalStats = await getGlobalStats();

  const features: Feature[] = [
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

        {/* Tuile Calendriers + bouton Voir mes détails */}
        <Card className="relative overflow-hidden border-border/60 bg-card">
          <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full blur-2xl opacity-20 bg-gradient-to-br from-sky-500 to-blue-600" />
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-full p-2 text-white bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm">
                {/* Icône calendrier simple */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">Tournées & Calendriers</CardTitle>
                <CardDescription className="truncate">Suivez la collecte et les distributions</CardDescription>
              </div>
              <div className="hidden sm:block">
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href="/dashboard/rapports">Voir mes détails</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-md border border-transparent bg-secondary/80 px-2 py-1 text-xs font-medium text-foreground">
                {(globalStats?.total_calendriers_distribues ?? 0).toLocaleString("fr-FR")} calendriers
              </span>
              <span className="inline-flex items-center rounded-md border border-transparent bg-secondary/80 px-2 py-1 text-xs font-medium text-foreground">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(globalStats?.total_montant_collecte ?? 0)}
              </span>
            </div>
            <div className="sm:hidden">
              <Button asChild variant="outline" size="sm" className="h-8 w-full"> 
                <Link href="/dashboard/rapports">Voir mes détails</Link>
              </Button>
            </div>
          </CardFooter>
          <Link href="/calendriers" className="absolute inset-0" aria-label="Aller à Tournées & Calendriers"><span className="sr-only">Aller à Tournées & Calendriers</span></Link>
        </Card>

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
