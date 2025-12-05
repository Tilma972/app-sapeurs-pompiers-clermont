import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

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

	// OPTIMISATION: Charger les données critiques d'abord, le reste en Suspense
	// Permet d'afficher la page plus rapidement (streaming)
	const profile = await getCurrentUserProfile();

	// OPTIMISATION: Nom de l'équipe déjà disponible via le JOIN
	const teamName = profile?.equipe?.nom || "Équipe SPP";
	const userName = profile?.full_name || user.email?.split("@")[0] || "Membre";

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
									<Link href="/dashboard/profil?tab=settings" className="underline font-medium">
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
								<Link href="/dashboard/profil?tab=settings" className="underline font-medium">
									Complète ton profil
								</Link>
								{" "} pour rejoindre une équipe et accéder à toutes les fonctionnalités.
							</AlertDescription>
						</Alert>
					)}

					{/* OPTIMISATION: Suspense pour streaming progressif */}
					{/* Progression chargée en parallèle, page s'affiche sans attendre */}
					<Suspense fallback={
						<Card className="border-l-4 border-l-primary">
							<div className="p-4 space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-2 w-full" />
							</div>
						</Card>
					}>
						<ProgressionWidget userId={user.id} />
					</Suspense>

					{/* Stats chargées en streaming */}
					<Suspense fallback={
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{[...Array(6)].map((_, i) => (
								<Card key={i} className="p-6 space-y-3">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-10 w-20" />
								</Card>
							))}
						</div>
					}>
						<DashboardStats userName={userName} profileComplete={Boolean(profile?.full_name)} />
					</Suspense>
				</div>
			</PwaContainer>
		</div>
	);
}

// OPTIMISATION: Composant async pour streaming avec Suspense
async function ProgressionWidget({ userId }: { userId: string }) {
	const userProgression = await getUserProgression(userId);

	if (!userProgression) return null;

	return (
		<Link href="/dashboard/profil">
			<Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
				<ProgressionBar progression={userProgression} compact />
			</Card>
		</Link>
	);
}

// OPTIMISATION: Composant async pour streaming avec Suspense
async function DashboardStats({ userName, profileComplete }: { userName: string; profileComplete: boolean }) {
	const supabase = await createClient();

	const [globalStats, approvedPhotosCountRes, ideasCountRes] = await Promise.all([
		getGlobalStats(),
		supabase.from('gallery_photos').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
		supabase.from('ideas').select('*', { count: 'exact', head: true }).is('deleted_at', null)
	]);

	const annoncesCount = undefined;
	const photosCount = approvedPhotosCountRes.count ?? 0;
	const ideasCount = ideasCountRes.count ?? 0;
	const eventsCount = undefined;
	const offersCount = undefined;

	return (
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
	);
}
