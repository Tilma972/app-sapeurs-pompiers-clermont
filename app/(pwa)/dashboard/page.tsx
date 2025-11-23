import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { DashboardBentoGrid } from "@/components/dashboard/dashboard-bento";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { getGlobalStats } from "@/lib/supabase/tournee";
import HeroSection from "@/components/hero-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { getUserProgression } from "@/lib/supabase/gamification";
import { ProgressionBar } from "@/components/gamification/progression-bar";
import { Card } from "@/components/ui/card";

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{ welcome?: string }>;
}) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) redirect("/auth/login");

	// Next.js 15: searchParams est maintenant une Promise
	const params = await searchParams;

	const [profile, globalStats, approvedPhotosCountRes, ideasCountRes, userProgression] = await Promise.all([
		getCurrentUserProfile(),
		getGlobalStats(),
		supabase.from('gallery_photos').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
		supabase.from('ideas').select('*', { count: 'exact', head: true }).is('deleted_at', null),
		getUserProgression(user.id)
	]);

	// Récupérer le nom de l'équipe si team_id existe
	let teamName = "Équipe SPP"; // Fallback par défaut
	if (profile?.team_id) {
		const { data: equipe } = await supabase
			.from('equipes')
			.select('nom')
			.eq('id', profile.team_id)
			.single();

		teamName = equipe?.nom || "Équipe SPP";
	}

	const userName = profile?.full_name || user.email?.split("@")[0] || "Membre";
	// const allocated = equipe?.calendriers_alloues ?? 0;
	// const distributed = personal?.totalCalendarsDistributed ?? 0;
	// const pct = allocated > 0 ? Math.min(100, Math.round((distributed / allocated) * 100)) : 0;

	// Placeholders for future integrations
	const annoncesCount = undefined;
	const photosCount = approvedPhotosCountRes.count ?? 0;
	const ideasCount = ideasCountRes.count ?? 0;
	const eventsCount = undefined;
	const offersCount = undefined;
	const profileComplete = Boolean(profile?.full_name);

	// Détection nouvel utilisateur et profil incomplet
	const isNewUser = params.welcome === "true";
	const needsTeam = !profile?.team_id;

	return (
		<div className="flex flex-col -mt-14">
			{/* Hero en pleine largeur, collé au header */}
			<HeroSection
				backgroundImage={
					"https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/esprit_pompiers.jpeg"
				}
				title={`Bienvenue, ${userName}`}
				subtitle={teamName}
				overlayOpacity="none"
				objectPosition="center"
				className="rounded-none w-screen"
			/>

			{/* Contenu principal avec padding */}
			<PwaContainer>
				<div className="space-y-5 pt-6">
					{/* Alerte bienvenue pour nouveaux utilisateurs */}
					{isNewUser && needsTeam && (
						<Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
							<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
							<AlertDescription className="text-green-800 dark:text-green-200">
								<strong>Bienvenue {profile?.first_name || userName} ! 🎉</strong>
								<p className="mt-1 text-sm">
									Pour profiter pleinement de l&apos;app, {" "}
									<Link href="/dashboard/profil" className="underline font-medium">
										complète ton profil ici
									</Link>
									{" "} et choisis ton équipe.
								</p>
							</AlertDescription>
						</Alert>
					)}

					{/* Alerte persistante si profil incomplet (pour utilisateurs existants) */}
					{!isNewUser && needsTeam && (
						<Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
							<AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
							<AlertDescription className="text-orange-800 dark:text-orange-200">
								<Link href="/dashboard/profil" className="underline font-medium">
									Complète ton profil
								</Link>
								{" "} pour rejoindre une équipe et accéder à toutes les fonctionnalités.
							</AlertDescription>
						</Alert>
					)}

					{/* Widget de progression */}
					{userProgression && (
						<Link href="/dashboard/profil">
							<Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
								<ProgressionBar progression={userProgression} compact />
							</Card>
						</Link>
					)}

					<DashboardBentoGrid
						annoncesCount={annoncesCount}
						photosCount={photosCount}
						ideasCount={ideasCount}
						eventsCount={eventsCount}
						offersCount={offersCount}
						profileComplete={profileComplete}
						globalCalendarsDistributed={globalStats?.total_calendriers_distribues}
						userName={userName}
					/>
				</div>
			</PwaContainer>
		</div>
	);
}
