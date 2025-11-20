import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, BarChart3, CheckCircle2 } from "lucide-react";
import { ZonesMap } from "@/components/admin/zones-tournees/zones-map";
import { ZonesList } from "@/components/admin/zones-tournees/zones-list";
import { ZonesStats } from "@/components/admin/zones-tournees/zones-stats";

export default async function AdminZonesTourneesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Vérifier que l'utilisateur est admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Récupérer toutes les zones enrichies
  const { data: zones } = await supabase
    .from('zones_tournees_enrichies')
    .select('*')
    .order('code_zone');

  // Récupérer les statistiques par équipe
  const { data: equipes } = await supabase
    .from('equipes')
    .select('id, nom, secteur, couleur, numero')
    .eq('actif', true)
    .order('ordre_affichage');

  // Récupérer les statistiques pour chaque équipe
  const statsPromises = (equipes || []).map(async (equipe) => {
    const { data: stats } = await supabase
      .rpc('get_equipe_zones_stats', {
        p_equipe_id: equipe.id,
        p_annee: new Date().getFullYear()
      })
      .single();

    return {
      ...equipe,
      stats: stats || {
        total_zones: 0,
        zones_a_faire: 0,
        zones_en_cours: 0,
        zones_terminees: 0,
        total_population: 0,
        total_calendriers_alloues: 0,
        total_calendriers_distribues: 0,
        progression_pct: 0
      }
    };
  });

  const equipesAvecStats = await Promise.all(statsPromises);

  // Récupérer tous les pompiers pour l'assignation
  const { data: pompiers } = await supabase
    .from('profiles')
    .select('id, full_name, email, team_id')
    .not('full_name', 'is', null)
    .order('full_name');

  // Statistiques globales
  const totalZones = zones?.length || 0;
  const zonesTerminees = zones?.filter(z => z.statut === 'Terminé').length || 0;
  const zonesEnCours = zones?.filter(z => z.statut === 'En cours').length || 0;
  const zonesAFaire = zones?.filter(z => z.statut === 'À faire').length || 0;
  const totalPopulation = zones?.reduce((sum, z) => sum + (z.population_estimee || 0), 0) || 0;
  const progressionGlobale = totalZones > 0
    ? Math.round((zonesTerminees / totalZones) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Gestion des zones de tournée
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualisez et gérez les zones de distribution de calendriers
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total zones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZones}</div>
            <p className="text-xs text-muted-foreground">
              {totalPopulation.toLocaleString()} habitants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{zonesTerminees}</div>
            <p className="text-xs text-muted-foreground">
              {progressionGlobale}% de progression
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{zonesEnCours}</div>
            <p className="text-xs text-muted-foreground">
              Zones en distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À faire</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zonesAFaire}</div>
            <p className="text-xs text-muted-foreground">
              Zones non assignées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par équipe */}
      <ZonesStats equipes={equipesAvecStats} />

      {/* Carte interactive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte des zones de tournée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZonesMap zones={zones || []} equipes={equipes || []} />
        </CardContent>
      </Card>

      {/* Liste des zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Liste des zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZonesList
            zones={zones || []}
            pompiers={pompiers || []}
            equipes={equipes || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
