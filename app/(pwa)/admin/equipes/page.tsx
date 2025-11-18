import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EquipeSettingsForm } from "@/components/admin/equipe-settings-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { UserCheck } from "lucide-react";

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
        <AdminPageHeader
          title="Gestion des équipes"
          description="Configuration de la rétribution et de la transparence"
          icon={<UserCheck className="h-6 w-6" />}
        />

        <AdminCard>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas les permissions pour gérer les équipes.
            {profile?.role !== 'admin' && " Seuls les chefs d'équipe et les administrateurs peuvent accéder à cette page."}
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des équipes"
        description={`Configurez les règles de rétribution et de transparence pour ${equipes.length > 1 ? 'vos équipes' : 'votre équipe'}`}
        icon={<UserCheck className="h-6 w-6" />}
      />

      <div className="space-y-4">
        {equipes.map((equipe: {
          id: string;
          nom: string;
          status?: 'active' | 'archived';
          enable_retribution: boolean;
          pourcentage_minimum_pot: number;
          pourcentage_recommande_pot: number;
          mode_transparence: 'prive' | 'equipe' | 'anonyme';
          calendriers_remis_par_admin?: number | null;
          communes?: string[] | null;
          secteur_centre_lat?: number | null;
          secteur_centre_lon?: number | null;
        }) => (
          <EquipeSettingsForm
            key={equipe.id}
            equipe={equipe}
            canEdit={profile?.role === 'admin'}
            canArchive={profile?.role === 'admin'}
          />
        ))}
      </div>
    </div>
  );
}
