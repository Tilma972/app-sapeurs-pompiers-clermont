import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, XCircle, TrendingUp, Users, User } from "lucide-react";
import { isTreasurerRole } from "@/lib/config";
import { getAllDemandes, getStatistiquesDemandes } from "@/lib/supabase/versement";
import { getAllDemandesPot, getStatistiquesPot } from "@/lib/supabase/pot-equipe";
import { formatCurrency } from "@/lib/formatters";
import { DemandesTresorerieTable } from "@/components/tresorerie/demandes-table";
import { DemandesPotTresorerieTable } from "@/components/tresorerie/demandes-pot-table";
import { StatutDemande } from "@/lib/types";
import { StatutDemandePot } from "@/lib/types/pot-equipe";

export default async function TresoreriePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Vérifier les permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !isTreasurerRole(profile.role)) {
    redirect("/");
  }

  // Récupérer les statistiques personnelles
  const stats = await getStatistiquesDemandes(supabase);

  // Récupérer toutes les demandes personnelles par statut
  const [demandesEnAttente, demandesEnCours, demandesRecentes] = await Promise.all([
    getAllDemandes(supabase, { statut: StatutDemande.EN_ATTENTE }, { field: 'created_at', direction: 'asc' }),
    getAllDemandes(supabase, { statut: [StatutDemande.EN_COURS, StatutDemande.VALIDEE] }, { field: 'created_at', direction: 'asc' }),
    getAllDemandes(supabase, { statut: [StatutDemande.PAYEE, StatutDemande.REJETEE] }, { field: 'updated_at', direction: 'desc' }, 20),
  ]);

  // Récupérer les statistiques pot d'équipe
  const statsPot = await getStatistiquesPot(supabase);

  // Récupérer toutes les demandes de pot d'équipe par statut
  const [demandesPotEnAttente, demandesPotEnCours, demandesPotRecentes] = await Promise.all([
    getAllDemandesPot(supabase, { statut: StatutDemandePot.EN_ATTENTE }),
    getAllDemandesPot(supabase, { statut: [StatutDemandePot.EN_COURS, StatutDemandePot.VALIDEE] }),
    getAllDemandesPot(supabase, { statut: [StatutDemandePot.PAYEE, StatutDemandePot.REJETEE] }),
  ]);

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Trésorerie</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des demandes de versement et du pot d&apos;équipe
          </p>
        </div>

        {/* Tabs principaux: Demandes personnelles vs Pot d'équipe */}
        <Tabs defaultValue="personnelles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personnelles" className="gap-2">
              <User className="h-4 w-4" />
              Demandes personnelles
              {(demandesEnAttente.length + demandesEnCours.length) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {demandesEnAttente.length + demandesEnCours.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pot_equipe" className="gap-2">
              <Users className="h-4 w-4" />
              Pot d&apos;équipe
              {(demandesPotEnAttente.length + demandesPotEnCours.length) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {demandesPotEnAttente.length + demandesPotEnCours.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Section Demandes personnelles */}
          <TabsContent value="personnelles" className="space-y-6">
            {/* Statistiques personnelles */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En attente</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.en_attente}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.montant_total_en_attente)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En cours</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.en_cours}</div>
                    <p className="text-xs text-muted-foreground">
                      À payer
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payées</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.payees}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.montant_total_paye)} versés
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.rejetees}</div>
                    <p className="text-xs text-muted-foreground">
                      Refusées
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sous-onglets demandes personnelles */}
            <Tabs defaultValue="en_attente" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en_attente" className="relative">
                  En attente
                  {demandesEnAttente.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {demandesEnAttente.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="en_cours" className="relative">
                  En cours
                  {demandesEnCours.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {demandesEnCours.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="historique">
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="en_attente" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Demandes en attente de validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesTresorerieTable demandes={demandesEnAttente} showActions={true} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="en_cours" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Demandes validées - À payer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesTresorerieTable demandes={demandesEnCours} showActions={true} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historique" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique récent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesTresorerieTable demandes={demandesRecentes} showActions={false} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Section Pot d'équipe */}
          <TabsContent value="pot_equipe" className="space-y-6">
            {/* Statistiques pot d'équipe */}
            {statsPot && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En attente</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsPot.total_en_attente}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(statsPot.montant_en_attente)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En cours</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsPot.total_en_cours}</div>
                    <p className="text-xs text-muted-foreground">
                      À payer
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payées</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsPot.total_payees}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(statsPot.montant_paye_mois)} ce mois
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                    <Users className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsPot.total_en_attente + statsPot.total_en_cours + statsPot.total_payees}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Toutes demandes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sous-onglets demandes pot d'équipe */}
            <Tabs defaultValue="en_attente" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en_attente" className="relative">
                  En attente
                  {demandesPotEnAttente.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {demandesPotEnAttente.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="en_cours" className="relative">
                  En cours
                  {demandesPotEnCours.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {demandesPotEnCours.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="historique">
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="en_attente" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Demandes en attente de validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesPotTresorerieTable demandes={demandesPotEnAttente} showActions={true} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="en_cours" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Demandes validées - À payer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesPotTresorerieTable demandes={demandesPotEnCours} showActions={true} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historique" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique récent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandesPotTresorerieTable demandes={demandesPotRecentes} showActions={false} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </PwaContainer>
  );
}
