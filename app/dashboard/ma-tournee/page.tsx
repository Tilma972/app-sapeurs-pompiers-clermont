import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getActiveTourneeWithTransactions } from "@/lib/supabase/tournee";
import { DonationModal } from "@/components/donation-modal";
import { TourneeClotureModal } from "@/components/tournee-cloture-modal";
import { ResendReceiptButton } from "@/components/resend-receipt-button";
import {
  Calendar,
  CheckCircle,
  Receipt,
  TrendingUp,
  Clock,
  MapPin
} from "lucide-react";

// Fonction utilitaire pour formater la durée
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

// Fonction utilitaire pour calculer la durée depuis le début de la tournée
const calculateDuration = (startTime: string) => {
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60)); // en minutes
};

export default async function MaTourneePage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Récupération des données réelles de la tournée active
  const tourneeData = await getActiveTourneeWithTransactions();

  if (!tourneeData) {
    // Rediriger vers la page calendriers si aucune tournée active
    redirect("/dashboard/calendriers");
  }

  const { tournee, transactions, summary } = tourneeData;

  // Si aucune tournée active, rediriger
  if (!tournee) {
    redirect("/dashboard/calendriers");
  }


  // Calculer la durée de la tournée
  const duration = calculateDuration(tournee.date_debut);
  
  // Calculer les statistiques
  const calendarsDistributed = summary?.calendars_distributed || 0;
  const amountCollected = summary?.montant_total || 0;
  const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* En-tête de la tournée - Style moderne shadcn/ui */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ma Tournée</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{tournee.zone}</span>
              </div>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{calendarsDistributed}</div>
              <div className="text-sm text-muted-foreground">Calendriers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currency.format(Math.max(0, Math.trunc(amountCollected || 0)))}</div>
              <div className="text-sm text-muted-foreground">Collecté</div>
            </div>
          </div>
        </div>
      </div>
        
        {/* Actions principales - Style ultra-compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card pour enregistrer un don */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs">Collecte de soutien</CardDescription>
                  <CardTitle className="text-lg font-semibold">Enregistrer un don</CardTitle>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="pt-0 pb-3">
              <div className="w-full">
                <div className="text-xs text-muted-foreground mb-2">
                  Don simple ou avec reçu fiscal
                </div>
                <DonationModal 
                  trigger={
                    <Button className="w-full h-8 text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Enregistrer un don
                    </Button>
                  }
                  tourneeId={tournee.id}
                />
              </div>
            </CardFooter>
          </Card>

          {/* Card pour clôturer la tournée */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs">Finaliser la collecte</CardDescription>
                  <CardTitle className="text-lg font-semibold">Clôturer la tournée</CardTitle>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finalisation
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="pt-0 pb-3">
              <div className="w-full">
                <div className="text-xs text-muted-foreground mb-2">
                  Terminer la collecte
                </div>
                <TourneeClotureModal 
                  trigger={
                    <Button className="w-full h-8 text-sm bg-orange-600 hover:bg-orange-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Clôturer ma tournée
                    </Button>
                  }
                  tourneeData={{
                    tournee,
                    transactions,
                    summary
                  }}
                  tourneeSummary={summary}
                />
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Résumé de la tournée - Style compact conditionnel */}
        {(calendarsDistributed > 0 || amountCollected > 0) && (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs">Progression aujourd&apos;hui</CardDescription>
                  <CardTitle className="text-lg font-semibold">Résumé</CardTitle>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  En cours
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="pt-0">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">
                    {calendarsDistributed}
                  </div>
                  <div className="text-xs text-muted-foreground">Calendriers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {currency.format(Math.max(0, Math.trunc(amountCollected || 0)))}
                  </div>
                  <div className="text-xs text-muted-foreground">Collecté</div>
                </div>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Historique des transactions - Style compact conditionnel */}
        {transactions.length > 0 && (
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs">Activité récente</CardDescription>
                  <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">
                  <Receipt className="h-3 w-3 mr-1" />
                  {transactions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardFooter className="pt-0">
              <div className="space-y-2 w-full">
                {transactions.slice(0, 2).map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {transaction.supporter_name || 'Anonyme'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {transaction.supporter_email ? (
                        <ResendReceiptButton transactionId={transaction.id} />
                      ) : null}
                      <div className="text-right min-w-[90px]">
                        <div className="text-sm font-bold text-foreground">{currency.format(Math.max(0, Math.trunc(transaction.amount || 0)))}</div>
                        <div className="text-xs text-muted-foreground text-right">
                          {transaction.calendar_accepted ? 'Soutien' : 'Fiscal'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length > 2 && (
                  <div className="text-center text-xs text-muted-foreground pt-1">
                    +{transactions.length - 2} autre{transactions.length - 2 > 1 ? 's' : ''} transaction{transactions.length - 2 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        )}

    </div>
  );
}
