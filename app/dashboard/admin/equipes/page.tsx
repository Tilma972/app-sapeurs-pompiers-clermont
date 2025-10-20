import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EquipeSettingsForm } from "@/components/admin/equipe-settings-form";
import { Shield } from "lucide-react";

export default async function AdminEquipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id, role')
    .eq('id', user.id)
    .single();

  // Récupérer les équipes selon les permissions
  let query = supabase
    .from('equipes')
    .select('*')
    .eq('actif', true)
    .order('ordre_affichage');

  // Si pas admin, seulement son équipe si chef
  if (profile?.role !== 'admin') {
    query = query.eq('chef_equipe_id', user.id);
  }

  const { data: equipes } = await query;

  if (!equipes || equipes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 border">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gestion des équipes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configuration de la rétribution et de la transparence
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Vous n&apos;avez pas les permissions pour gérer les équipes.
              {profile?.role !== 'admin' && " Seuls les chefs d\'équipe et les administrateurs peuvent accéder à cette page."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Gestion des équipes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les règles de rétribution et de transparence pour {equipes.length > 1 ? 'vos équipes' : 'votre équipe'}
        </p>
      </div>

      <div className="space-y-4">
        {equipes.map((equipe: { id: string; nom: string; enable_retribution: boolean; pourcentage_minimum_pot: number; pourcentage_recommande_pot: number; mode_transparence: 'prive' | 'equipe' | 'anonyme'; }) => (
          <EquipeSettingsForm key={equipe.id} equipe={equipe} />
        ))}
      </div>
    </div>
  );
}
