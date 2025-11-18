import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/formatters";

export default async function CalendriersSuiviAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Vérifier les permissions admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect("/dashboard");
  }

  // Récupérer le suivi par équipe
  const { data: equipeSuivi } = await supabase
    .from('equipe_calendriers_suivi')
    .select('*')
    .order('equipe_numero');

  const equipes = equipeSuivi || [];

  // Récupérer le suivi détaillé par membre
  const { data: membresSuivi } = await supabase
    .from('membres_calendriers_suivi')
    .select('*')
    .order('equipe_nom, full_name');

  const membres = membresSuivi || [];

  // Calculer les statistiques globales
  const totalRemisParAdmin = equipes.reduce((sum, e) => sum + (e.calendriers_remis_par_admin || 0), 0);
  const totalConfirmes = equipes.reduce((sum, e) => sum + (e.total_confirmes_membres || 0), 0);
  const totalDistribues = equipes.reduce((sum, e) => sum + (e.calendriers_distribues_total || 0), 0);
  const stockDormantTotal = totalConfirmes - totalDistribues;

  // Membres n'ayant pas confirmé
  const membresNonConfirmes = membres.filter(m => !m.calendriers_reception_confirmee);

  // Membres avec beaucoup de stock dormant (> 20)
  const membresStockDormant = membres.filter(m => m.stock_en_main > 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Suivi des calendriers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rapprochement entre calendriers remis et confirmés par les membres
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remis aux équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRemisParAdmin)}</div>
            <p className="text-xs text-muted-foreground mt-1">Calendriers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(totalConfirmes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((totalConfirmes / totalRemisParAdmin) * 100)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribués</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalDistribues)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((totalDistribues / totalConfirmes) * 100)}% des confirmés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock dormant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatNumber(stockDormantTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmés non distribués</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {(membresNonConfirmes.length > 0 || membresStockDormant.length > 0) && (
        <div className="space-y-3">
          {membresNonConfirmes.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4" />
                  {membresNonConfirmes.length} membre(s) n&apos;ont pas confirmé la réception
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-800 dark:text-amber-200">
                <ul className="list-disc list-inside space-y-1">
                  {membresNonConfirmes.slice(0, 5).map(m => (
                    <li key={m.user_id}>{m.full_name} ({m.equipe_nom})</li>
                  ))}
                  {membresNonConfirmes.length > 5 && (
                    <li>... et {membresNonConfirmes.length - 5} autres</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {membresStockDormant.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Package className="h-4 w-4" />
                  {membresStockDormant.length} membre(s) avec stock dormant important (&gt; 20)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 dark:text-blue-200">
                <ul className="list-disc list-inside space-y-1">
                  {membresStockDormant.slice(0, 5).map(m => (
                    <li key={m.user_id}>
                      {m.full_name} ({m.equipe_nom}) : {m.stock_en_main} calendriers en main
                    </li>
                  ))}
                  {membresStockDormant.length > 5 && (
                    <li>... et {membresStockDormant.length - 5} autres</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Suivi par équipe */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi par équipe</CardTitle>
          <CardDescription>
            Rapprochement entre calendriers remis et confirmés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {equipes.map((equipe) => {
              const tauxConfirmation = equipe.calendriers_remis_par_admin > 0
                ? Math.round((equipe.total_confirmes_membres / equipe.calendriers_remis_par_admin) * 100)
                : 0;

              const hasEcart = equipe.ecart !== 0;
              const ecartPositif = equipe.ecart > 0;

              return (
                <div key={equipe.equipe_id} className="space-y-2 border-b pb-4 last:border-0">
                  {/* En-tête équipe */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: equipe.equipe_couleur }}
                      />
                      <h3 className="font-semibold">{equipe.equipe_nom}</h3>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {equipe.nb_membres_total} membres
                      </Badge>
                    </div>
                    {!hasEcart && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        À jour
                      </Badge>
                    )}
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Remis par admin</p>
                      <p className="font-semibold">{formatNumber(equipe.calendriers_remis_par_admin)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confirmés</p>
                      <p className="font-semibold text-green-600">
                        {formatNumber(equipe.total_confirmes_membres)}
                        <span className="text-muted-foreground text-xs ml-1">
                          ({equipe.nb_membres_confirmes}/{equipe.nb_membres_total})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Écart</p>
                      <p className={`font-semibold ${hasEcart ? (ecartPositif ? 'text-amber-600' : 'text-red-600') : 'text-green-600'}`}>
                        {equipe.ecart > 0 ? '+' : ''}{formatNumber(equipe.ecart)}
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Taux de confirmation</span>
                      <span>{tauxConfirmation}%</span>
                    </div>
                    <Progress value={tauxConfirmation} className="h-2" />
                  </div>

                  {/* Stock dormant */}
                  {equipe.stock_dormant > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Stock dormant : {formatNumber(equipe.stock_dormant)} calendriers confirmés non distribués
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
