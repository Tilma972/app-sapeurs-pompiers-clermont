import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import FeatureCardsGrid from "@/components/dashboard/feature-cards";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getUserPersonalStats } from "@/lib/supabase/tournee";
import { getUserEquipeInfo } from "@/lib/supabase/equipes";
import HeroSection from "@/components/hero-section";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPreviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, personal, equipe] = await Promise.all([
    getCurrentUserProfile(),
    getUserPersonalStats(),
    getUserEquipeInfo(user.id),
  ]);

  const userName = profile?.full_name || user.email?.split("@")[0] || "Membre";
  const teamName = equipe?.equipe_nom ?? null;
  const allocated = equipe?.calendriers_alloues ?? 0;
  const distributed = personal?.totalCalendarsDistributed ?? 0;
  const pct = allocated > 0 ? Math.min(100, Math.round((distributed / allocated) * 100)) : 0;

  // Placeholders for future integrations
  const annoncesCount = undefined; // derive when the feature exists
  const photosCount = undefined;
  const eventsCount = undefined;
  const offersCount = undefined;
  const profileComplete = Boolean(profile?.full_name);

  return (
    <>
      {/* Full-width hero outside the constrained FocusedContainer */}
      <div className="w-full -mt-10">
        <HeroSection
          backgroundImage={
            "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/esprit_pompiers.jpeg"
          }
          title={`Bienvenue, ${userName}`}
          subtitle={teamName ? `Équipe ${teamName}` : undefined}
          overlayOpacity="medium"
          rounded={false}
          objectPosition="center"
        />
      </div>

      <FocusedContainer>
        <div className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tournées & Distribution</h2>
            {teamName && (
              <Badge variant="secondary" className="bg-secondary/80">{teamName}</Badge>
            )}
          </div>
          <Card className="p-4 bg-card/95 backdrop-blur-sm border-border/60">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Calendriers distribués</span>
              <span className="text-muted-foreground">
                {distributed.toLocaleString("fr-FR")} / {allocated.toLocaleString("fr-FR")} ({pct}%)
              </span>
            </div>
            <div className="mt-2">
              <Progress value={pct} />
            </div>
          </Card>
        </section>

  <Separator className="my-2" />

        <FeatureCardsGrid
          annoncesCount={annoncesCount}
          photosCount={photosCount}
          eventsCount={eventsCount}
          offersCount={offersCount}
          profileComplete={profileComplete}
        />
        </div>
      </FocusedContainer>
    </>
  );
}
