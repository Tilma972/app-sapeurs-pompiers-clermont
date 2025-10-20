import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RetributionPreferencesCard } from "@/components/retribution-preferences-card";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Rôle utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id, equipes(pourcentage_minimum_pot, pourcentage_recommande_pot)')
    .eq('id', user.id)
    .single();

  // Compte + préférence
  const { data: compte } = await supabase
    .from('comptes_sp')
    .select('pourcentage_pot_equipe_defaut')
    .eq('user_id', user.id)
    .single();

  type EqSettings = { pourcentage_minimum_pot?: number; pourcentage_recommande_pot?: number };
  const eqRaw = (profile as unknown as { equipes?: EqSettings | EqSettings[] })?.equipes;
  const eqObj: EqSettings | undefined = Array.isArray(eqRaw) ? eqRaw[0] : eqRaw;
  const minimumEquipe = eqObj?.pourcentage_minimum_pot ?? 0;
  const recommandationEquipe = eqObj?.pourcentage_recommande_pot ?? 30;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-sm text-muted-foreground">Personnalisez votre expérience selon votre rôle</p>
          </div>
          <Badge variant="outline">{profile?.role || 'membre'}</Badge>
        </div>
      </div>

      {/* Section: Répartition (visible à tous) */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Rétribution</div>
            <h2 className="text-lg font-semibold">Répartition de mes 30%</h2>
          </div>
          <RetributionPreferencesCard
            currentPreference={compte?.pourcentage_pot_equipe_defaut ?? null}
            minimumEquipe={minimumEquipe}
            recommandationEquipe={recommandationEquipe}
          />
        </CardContent>
      </Card>

      {/* Section: Équipe (chef/admin) - Placeholder
          On y mettra plus tard les réglages d'équipe accessibles selon le rôle. */}
      {(profile?.role === 'admin') && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-2 text-sm text-muted-foreground">Visibilité admin</div>
            <div className="text-muted-foreground text-sm">D&apos;autres paramètres d&apos;équipe seront disponibles ici.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
