import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { 
  getActiveTourneeWithTransactions,
  getUserPersonalStats,
  getUserHistory,
  getTeamsSummary
} from "@/lib/supabase/tournee";
import { getEquipesRanking } from "@/lib/supabase/equipes";
import { 
  Calendar, 
  Play,
  Target,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";
import Link from "next/link";
import { StartTourneeButton } from "@/components/start-tournee-button";
import TeamsRankingChart from "@/components/charts/teams-ranking-chart";

export default async function CalendriersPage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Récupération des données
  const profile = await getCurrentUserProfile();
  const personalStats = await getUserPersonalStats();
  const userHistory = await getUserHistory();
  const teamsSummary = await getTeamsSummary();
  const equipesRanking = await getEquipesRanking();
  
  // Vérification s'il y a une tournée active
  const tourneeData = await getActiveTourneeWithTransactions();
  const hasActiveTournee = tourneeData && tourneeData.tournee;

  // Objectif fixe (peut être récupéré depuis la base de données)
  const objectiveCalendars = 50;
  const calendarsRemaining = Math.max(0, objectiveCalendars - (personalStats?.totalCalendarsDistributed || 0));

  return (
    <div className="space-y-8">
        
        {/* Carte d'Action - Démarrer une nouvelle tournée */}
        <Card className="bg-blue-50 border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Prêt pour une nouvelle tournée ?</h3>
                <p className="text-sm text-gray-600">Bonjour, {profile?.full_name || user.email?.split('@')[0]}</p>
              </div>
            </div>
            {hasActiveTournee ? (
              <Link href="/dashboard/ma-tournee">
                <Button className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Continuer ma tournée
                </Button>
              </Link>
            ) : (
              <StartTourneeButton />
            )}
          </CardContent>
        </Card>

        {/* Carte "Mes Indicateurs" */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mes Indicateurs</h3>
                <p className="text-sm text-gray-600">Performance personnelle</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {calendarsRemaining}
                </div>
                <div className="text-sm text-gray-600">Objectif calendriers restants</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {personalStats?.totalAmountCollected.toFixed(0) || 0}€
                </div>
                <div className="text-sm text-gray-600">Montant total collecté</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {personalStats?.averagePerCalendar.toFixed(1) || 0}€
                </div>
                <div className="text-sm text-gray-600">Moyenne par calendrier</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte "Progression des équipes" - Version compacte */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Progression des équipes</h3>
                <p className="text-sm text-gray-600">Classement en temps réel</p>
              </div>
            </div>
            
            {/* Grille compacte des équipes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipesRanking.slice(0, 5).map((equipe, index) => (
                <div 
                  key={equipe.equipe_nom} 
                  className={`p-3 rounded-lg border-l-4 ${
                    index === 0 ? 'border-l-yellow-500 bg-yellow-50' :
                    index === 1 ? 'border-l-gray-400 bg-gray-50' :
                    index === 2 ? 'border-l-orange-400 bg-orange-50' :
                    'border-l-blue-400 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {index === 0 && <TrendingUp className="h-4 w-4 text-yellow-600" />}
                      <span className="font-semibold text-sm text-gray-900">
                        {equipe.equipe_nom}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-600">#{index + 1}</span>
                  </div>
                  
                  {/* Barre de progression compacte */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Progression</span>
                      <span>{equipe.progression_pourcentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-400' :
                          'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(equipe.progression_pourcentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Stats compactes */}
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                    <span>{equipe.montant_collecte}€</span>
                    <span>{equipe.calendriers_distribues} cal.</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Résumé global compact */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {equipesRanking.reduce((sum, e) => sum + e.montant_collecte, 0)}€
                  </div>
                  <div className="text-xs text-gray-500">Total collecté</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {equipesRanking.reduce((sum, e) => sum + e.calendriers_distribues, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total calendriers</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.round(equipesRanking.reduce((sum, e) => sum + e.progression_pourcentage, 0) / equipesRanking.length)}%
                  </div>
                  <div className="text-xs text-gray-500">Moyenne progression</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte "Mon Historique" */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mon Historique</h3>
                <p className="text-sm text-gray-600">Dernières tournées terminées</p>
              </div>
            </div>
            {userHistory.length > 0 ? (
              <div className="space-y-4">
                {userHistory.map((tournee, index) => (
                  <div key={tournee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(tournee.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tournee.calendarsDistributed} calendriers
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {tournee.amountCollected.toFixed(0)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune tournée terminée</p>
                <p className="text-sm">Vos tournées apparaîtront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte "Classement des Équipes" */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Classement des Équipes</h3>
                <p className="text-sm text-gray-600">Performance par équipe</p>
              </div>
            </div>
            <TeamsRankingChart teamsSummary={teamsSummary} />
          </CardContent>
        </Card>
    </div>
  );
}
