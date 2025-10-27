import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getActiveTourneeWithTransactions } from "@/lib/supabase/tournee";
import { PaymentCardModal } from "@/components/payment-card-modal";
import { ReceiptGenerationModal } from "@/components/receipt-generation-modal";
import { TourneeClotureModal } from "@/components/tournee-cloture-modal";
import { ResendReceiptButton } from "@/components/resend-receipt-button";
import { RoleBadge } from "@/components/role-badge";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

const calculateDuration = (startTime: string) => {
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
};

export default async function MaTourneePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const tourneeData = await getActiveTourneeWithTransactions();

  if (!tourneeData) {
    redirect("/dashboard/calendriers");
  }

  const { tournee, transactions, summary } = tourneeData;

  if (!tournee) {
    redirect("/dashboard/calendriers");
  }

  const duration = calculateDuration(tournee.date_debut);
  const calendarsDistributed = summary?.calendars_distributed || 0;
  const amountCollected = summary?.montant_total || 0;
  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  // Pré-check rétribution
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, equipes(enable_retribution)")
    .eq("id", user.id)
    .single();
  type EqFlag = { enable_retribution?: boolean };
  const eqJoin = (profile as unknown as { equipes?: EqFlag | EqFlag[] })
    ?.equipes;
  const eqFlag: EqFlag | undefined = Array.isArray(eqJoin) ? eqJoin[0] : eqJoin;
  const retributionEnabled = !!eqFlag?.enable_retribution;

  return (
    <div className="min-h-screen pb-20 sm:pb-8">
      {/* Header Mobile Optimisé */}
      <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">Ma Tournée</h1>
            <Badge 
              variant="outline" 
              className="shrink-0 text-xs sm:text-sm"
            >
              <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-green-500 sm:h-2.5 sm:w-2.5" />
              Active
            </Badge>
          </div>
          
          {/* Info compacte sur mobile */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{tournee.zone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{formatDuration(duration)}</span>
            </div>
            <RoleBadge />
          </div>
        </div>
      </div>

      {/* Stats Horizontales Scrollables sur Mobile */}
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        {/* Mobile: scroll horizontal */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden snap-x snap-mandatory">
          {/* Stat 1 */}
          <div className="min-w-[140px] snap-start rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">Collecté</span>
            </div>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {currency.format(amountCollected)}
            </p>
          </div>

          {/* Stat 2 */}
          <div className="min-w-[140px] snap-start rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-muted-foreground">Calendriers</span>
            </div>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              {calendarsDistributed}
            </p>
          </div>

          {/* Stat 3 */}
          <div className="min-w-[140px] snap-start rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-muted-foreground">Moyenne</span>
            </div>
            <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
              {calendarsDistributed > 0
                ? currency.format(amountCollected / calendarsDistributed)
                : "0€"}
            </p>
          </div>
        </div>

        {/* Desktop: grid classique */}
        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Montant Collecté
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currency.format(amountCollected)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calendriers
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calendarsDistributed}</div>
              <p className="text-xs text-muted-foreground">
                Distribués aujourd&apos;hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Moyenne
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calendarsDistributed > 0
                  ? currency.format(amountCollected / calendarsDistributed)
                  : "0€"}
              </div>
              <p className="text-xs text-muted-foreground">
                Par calendrier
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions Principales - Format Mobile First */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sm:text-base">
          Actions
        </h3>

        {/* Mobile: Boutons empilés pleine largeur */}
        <div className="space-y-2 sm:hidden">
          <PaymentCardModal 
            tourneeId={tournee.id}
          />
          
          <ReceiptGenerationModal 
            tourneeId={tournee.id}
          />

          {retributionEnabled && (
            <TourneeClotureModal
              trigger={
                <Button
                  variant="destructive"
                  className="w-full h-12"
                  size="default"
                >
                  Clôturer la tournée
                </Button>
              }
              tourneeData={{ tournee, transactions, summary }}
              tourneeSummary={summary}
            />
          )}
        </div>

        {/* Desktop: Cards comme avant */}
        <div className="hidden sm:block sm:space-y-3">
          <Card className="border-2 border-primary">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-lg">
                    Enregistrer un don
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Don simple ou avec reçu fiscal
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div className="flex gap-2">
                <PaymentCardModal tourneeId={tournee.id} />
                <ReceiptGenerationModal tourneeId={tournee.id} />
              </div>
            </CardContent>
          </Card>

          {retributionEnabled && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Clôturer la tournée</h4>
                    <p className="text-xs text-muted-foreground">
                      Terminer et finaliser la collecte
                    </p>
                  </div>
                  <TourneeClotureModal
                    trigger={
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Clôturer
                      </Button>
                    }
                    tourneeData={{ tournee, transactions, summary }}
                    tourneeSummary={summary}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Transactions - Format Liste Mobile Optimisé */}
      {transactions.length > 0 && (
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sm:text-base">
              Dernières transactions
            </h3>
            <Badge variant="secondary" className="text-xs">
              {transactions.length}
            </Badge>
          </div>

          {/* Mobile: Liste simplifiée */}
          <div className="space-y-2 sm:hidden">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(transaction.supporter_name || "A")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {transaction.supporter_name || "Anonyme"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {currency.format(transaction.amount || 0)}
                  </p>
                  {transaction.supporter_email && (
                    <div className="mt-1">
                      <ResendReceiptButton 
                        transactionId={transaction.id}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Card comme avant */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              {transactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {(transaction.supporter_name || "A")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.supporter_name || "Anonyme"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                          {" • "}
                          {transaction.calendar_accepted
                            ? "Don simple"
                            : "Reçu fiscal"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {transaction.supporter_email && (
                        <ResendReceiptButton transactionId={transaction.id} />
                      )}
                      <p className="text-sm font-bold">
                        {currency.format(transaction.amount || 0)}
                      </p>
                    </div>
                  </div>
                  {index < Math.min(transactions.length, 5) - 1 && (
                    <Separator />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {transactions.length > 5 && (
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-xs sm:text-sm"
            >
              Voir {transactions.length - 5} autres transactions
              <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Empty State Mobile Optimisé */}
      {transactions.length === 0 && (
        <div className="px-4 py-8 sm:px-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center sm:py-12">
              <Users className="h-10 w-10 text-muted-foreground mb-3 sm:h-12 sm:w-12 sm:mb-4" />
              <h3 className="font-semibold text-base mb-1 sm:text-lg">
                Aucune transaction
              </h3>
              <p className="text-xs text-muted-foreground max-w-[250px] sm:text-sm sm:max-w-sm">
                Commencez à enregistrer des dons pour voir l&apos;activité ici
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}