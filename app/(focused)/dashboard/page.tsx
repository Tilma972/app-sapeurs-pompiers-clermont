import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import FeatureCardsGrid from "@/components/dashboard/feature-cards";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
// import { getUserPersonalStats } from "@/lib/supabase/tournee";
// import { getUserEquipeInfo } from "@/lib/supabase/equipes";
import HeroSection from "@/components/hero-section";
// import { Card } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login");

	const [profile] = await Promise.all([
		getCurrentUserProfile(),
	]);

const userName = profile?.full_name || user.email?.split("@")[0] || "Membre";
	// const teamName = equipe?.equipe_nom ?? null;
	// const allocated = equipe?.calendriers_alloues ?? 0;
	// const distributed = personal?.totalCalendarsDistributed ?? 0;
	// const pct = allocated > 0 ? Math.min(100, Math.round((distributed / allocated) * 100)) : 0;

// Placeholders for future integrations
const annoncesCount = undefined;
const photosCount = undefined;
const eventsCount = undefined;
const offersCount = undefined;
const profileComplete = Boolean(profile?.full_name);

return (
<div className="flex flex-col -mt-14">
{/* Hero en pleine largeur, collé au header */}
<HeroSection
backgroundImage={
"https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/esprit_pompiers.jpeg"
}
title={`Bienvenue, ${userName}`}
overlayOpacity="none"
objectPosition="center"
className="rounded-none w-screen"
/>

{/* Contenu principal avec padding */}
<FocusedContainer>
<div className="space-y-5 pt-6">
<FeatureCardsGrid
annoncesCount={annoncesCount}
photosCount={photosCount}
eventsCount={eventsCount}
offersCount={offersCount}
profileComplete={profileComplete}
/>
</div>
</FocusedContainer>
</div>
);
}
