import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, BarChart3, CheckCircle2 } from "lucide-react";
import { ZonesList } from "@/components/admin/zones-tournees/zones-list";
import { ZonesStats } from "@/components/admin/zones-tournees/zones-stats";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// OPTIMISATION: Dynamic import pour Leaflet (~140KB)
// Évite de charger la carte si l'utilisateur ne scroll pas jusqu'à elle
// Note: Le composant ZonesMap gère déjà ssr: false en interne
const ZonesMap = dynamic(
  () => import("@/components/admin/zones-tournees/zones-map").then(mod => ({ default: mod.ZonesMap })),
  {
    loading: () => (
      <div className="w-full h-[500px] rounded-lg">
        <Skeleton className="w-full h-full" />
      </div>
    ),
  }
);

export default async function AdminZonesTourneesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Vérifier que l'utilisateur est admin ou chef d'équipe
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'chef_equipe'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const isChefEquipe = profile.role === 'chef_equipe';
  const userTeamId = profile.team_id;

  // Construction de la requête pour les zones
  let zonesQuery = supabase
    .from('zones_tournees_enrichies')
    .select('*')
    .order('code_zone');

  // Si chef d'équipe, filtrer par son équipe
  if (isChefEquipe && userTeamId) {
    zonesQuery = zonesQuery.eq('equipe_id', userTeamId);
  } else if (isChefEquipe && !userTeamId) {
    // Cas limite : chef d'équipe sans équipe assignée
    zonesQuery = zonesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Retourne rien
  }

  const { data: zones } = await zonesQuery;

  // Récupérer les équipes (filtré si chef d'équipe)
  let equipesQuery = supabase
    .from('equipes')
    .select('id, nom, secteur, couleur, numero')
    .eq('actif', true)
    .order('ordre_affichage');

  if (isChefEquipe && userTeamId) {
    equipesQuery = equipesQuery.eq('id', userTeamId);
  }

  const { data: equipes } = await equipesQuery;

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
      stats: (stats || {
        total_zones: 0,
        zones_a_faire: 0,
        zones_en_cours: 0,
        zones_terminees: 0,
        total_population: 0,
        total_calendriers_alloues: 0,
        total_calendriers_distribues: 0,
        progression_pct: 0
      }) as {
        total_zones: number;
        zones_a_faire: number;
        zones_en_cours: number;
        zones_terminees: number;
        total_population: number;
        total_calendriers_alloues: number;
        total_calendriers_distribues: number;
        progression_pct: number;
      }
    };
  });

  const equipesAvecStats = await Promise.all(statsPromises);

  // Récupérer les pompiers pour l'assignation (filtré si chef d'équipe)
  let pompiersQuery = supabase
    .from('profiles')
    .select('id, full_name, email, team_id')
    .not('full_name', 'is', null)
    .order('full_name');

  if (isChefEquipe && userTeamId) {
    pompiersQuery = pompiersQuery.eq('team_id', userTeamId);
  }

  const { data: pompiers } = await pompiersQuery;

  // Statistiques globales (calculées sur les zones visibles)
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
          {isChefEquipe ? "Gestion de mon secteur" : "Gestion des zones de tournée"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isChefEquipe
            ? "Gérez les zones et les assignations de votre équipe"
            : "Visualisez et gérez les zones de distribution de calendriers"}
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

      {/* Statistiques par équipe (caché pour chef d'équipe car redondant avec global) */}
      {!isChefEquipe && <ZonesStats equipes={equipesAvecStats} />}

      {/* Carte interactive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte des zones
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
