import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SectorMapFullscreen from "@/components/tournee/sector-map-fullscreen";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SECTEUR_LABELS: Record<string, string> = {
  'nord': 'Secteur Nord',
  'sud': 'Secteur Sud',
  'ouest': 'Secteur Ouest',
  'nord-est': 'Secteur Nord-Est',
  'sud-est': 'Secteur Sud-Est',
};

export default async function CarteSecteurt() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Récupérer le secteur de l'équipe
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) {
    redirect("/ma-tournee");
  }

  const { data: equipe } = await supabase
    .from("equipes")
    .select("secteur")
    .eq("id", profile.team_id)
    .single();

  const secteur = equipe?.secteur;
  if (!secteur) {
    redirect("/ma-tournee");
  }

  const secteurLabel = SECTEUR_LABELS[secteur] || secteur;

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header fixe */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Link 
          href="/ma-tournee"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Retour</span>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">📍 {secteurLabel}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zone en rouge = ton périmètre d&apos;intervention
          </p>
        </div>
        <div className="w-20"></div> {/* Spacer pour centrer le titre */}
      </div>

      {/* Carte plein écran */}
      <div className="flex-1">
        <SectorMapFullscreen secteur={secteur} />
      </div>
    </div>
  );
}
