import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { RetributionPreferencesCard } from "@/components/retribution-preferences-card";
import { EquipeSettingsForm } from "@/components/admin/equipe-settings-form";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { getUserPreference } from "@/lib/supabase/compte";
import { getEquipeSettingsFromProfile, getEquipeDetails } from "@/lib/supabase/equipes";
import { RETRIBUTION_CONFIG, canManageTeam } from "@/lib/config";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Rôle utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  // Récupération des données via les helpers
  const [userPreference, { settings, teamId }] = await Promise.all([
    getUserPreference(supabase, user.id),
    getEquipeSettingsFromProfile(supabase, user.id),
  ]);

  const minimumEquipe = settings?.pourcentage_minimum_pot ?? RETRIBUTION_CONFIG.MINIMUM_POT_EQUIPE_DEFAULT;
  const recommandationEquipe = settings?.pourcentage_recommande_pot ?? RETRIBUTION_CONFIG.RECOMMANDE_POT_EQUIPE_DEFAULT;

  // Charger les réglages complets d'équipe si nécessaire (chef/admin uniquement)
  const isChefOrAdmin = canManageTeam(profile?.role);
  const equipeDetails = (isChefOrAdmin && teamId) ? await getEquipeDetails(supabase, teamId) : null;

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Paramètres</h1>
            </div>
            <Badge variant="outline">{profile?.role || 'membre'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Personnalisez votre expérience
          </p>
        </div>

        {/* Section: Répartition (visible à tous) */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Rétribution</div>
              <h2 className="text-lg font-semibold">Répartition de mes 30%</h2>
            </div>
            <RetributionPreferencesCard
              currentPreference={userPreference}
              minimumEquipe={minimumEquipe}
              recommandationEquipe={recommandationEquipe}
            />
          </CardContent>
        </Card>

        {/* Section: Gestion d'équipe (chef/admin) */}
        {isChefOrAdmin && equipeDetails && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Équipe</div>
                <h2 className="text-lg font-semibold">Gestion d&apos;équipe</h2>
              </div>
              <EquipeSettingsForm equipe={equipeDetails} />
            </CardContent>
          </Card>
        )}
      </div>
    </PwaContainer>
  );
}
