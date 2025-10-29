import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import FeatureCardsGrid from "@/components/dashboard/feature-cards";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getUserPersonalStats } from "@/lib/supabase/tournee";
import { getUserEquipeInfo } from "@/lib/supabase/equipes";

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

  // Placeholders for future integrations
  const annoncesCount = undefined; // derive when the feature exists
  const photosCount = undefined;
  const eventsCount = undefined;
  const offersCount = undefined;
  const profileComplete = Boolean(profile?.full_name);

  return (
    <FocusedContainer>
      <div className="space-y-4">
        <DashboardHero
          userName={userName}
          teamName={teamName}
          distributed={distributed}
          allocated={allocated}
        />

        <FeatureCardsGrid
          annoncesCount={annoncesCount}
          photosCount={photosCount}
          eventsCount={eventsCount}
          offersCount={offersCount}
          profileComplete={profileComplete}
        />
      </div>
    </FocusedContainer>
  );
}
