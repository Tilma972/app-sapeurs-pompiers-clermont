import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

export default async function DashboardPage() {
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
										<section className="space-y-2">
											<Link href="/calendriers" className="block group">
												<Card className="p-4 bg-card/95 backdrop-blur-sm border-border/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
													<div className="flex items-center justify-between mb-3">
														<h2 className="text-lg font-semibold group-hover:text-primary transition-colors">Tournées & Distribution</h2>
														{teamName && (
															<Badge variant="secondary" className="bg-secondary/80">{teamName}</Badge>
														)}
													</div>
													<div className="flex items-center justify-between text-sm mb-2">
														<span className="font-medium text-muted-foreground">Calendriers distribués</span>
														<span className="text-muted-foreground">
															{distributed.toLocaleString("fr-FR")} / {allocated.toLocaleString("fr-FR")} ({pct}%)
														</span>
													</div>
													<Progress value={pct} className="h-2" />
													<div className="flex items-center justify-end mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
														<span>Voir le détail</span>
														<ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
													</div>
												</Card>
											</Link>
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
</div>
);
}
