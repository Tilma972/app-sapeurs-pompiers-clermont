import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { isTreasurerRole } from "@/lib/config";
import { getAllDemandes, getStatistiquesDemandes } from "@/lib/supabase/versement";
import { formatCurrency } from "@/lib/formatters";
import { DemandesTresorerieTable } from "@/components/tresorerie/demandes-table";
import { StatutDemande } from "@/lib/types";

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

  // Récupérer les statistiques
  const stats = await getStatistiquesDemandes(supabase);

  // Récupérer toutes les demandes par statut
  const [demandesEnAttente, demandesEnCours, demandesRecentes] = await Promise.all([
    getAllDemandes(supabase, { statut: StatutDemande.EN_ATTENTE }, { field: 'created_at', direction: 'asc' }),
    getAllDemandes(supabase, { statut: [StatutDemande.EN_COURS, StatutDemande.VALIDEE] }, { field: 'created_at', direction: 'asc' }),
    getAllDemandes(supabase, { statut: [StatutDemande.PAYEE, StatutDemande.REJETEE] }, { field: 'updated_at', direction: 'desc' }, 20),
  ]);

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Trésorerie</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des demandes de versement
          </p>
        </div>

        {/* Statistiques */}
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

        {/* Onglets de gestion */}
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
      </div>
    </PwaContainer>
  );
}
