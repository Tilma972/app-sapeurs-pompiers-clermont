import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  // Objectif fictif pour la démo (à adapter selon votre logique)
  const targetAmount = 5000;
  const progressPercentage = Math.min((amountCollected / targetAmount) * 100, 100);

  // Pré-check rétribution
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, equipes(enable_retribution)")
    .eq("id", user.id)
    .single();
  type EqFlag = { enable_retribution?: boolean };
  const eqJoin = (profile as unknown as { equipes?: EqFlag | EqFlag[] })?.equipes;
  const eqFlag: EqFlag | undefined = Array.isArray(eqJoin) ? eqJoin[0] : eqJoin;
  const retributionEnabled = !!eqFlag?.enable_retribution;

  return (
    <div className="container max-w-3xl space-y-6 pb-8">
      {/* Header moderne avec stats inline - Pattern shadcn Dashboard */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Ma Tournée</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{tournee.zone}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(duration)}</span>
              </div>
              <RoleBadge />
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            <TrendingUp className="mr-1 h-3 w-3" />
            En cours
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Stats Cards - Pattern shadcn Dashboard avec Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Collecté</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.format(amountCollected)}</div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressPercentage.toFixed(0)}% de l&apos;objectif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendriers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calendarsDistributed}</div>
            <p className="text-xs text-muted-foreground mt-2">Distribués aujourd&apos;hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calendarsDistributed > 0
                ? currency.format(amountCollected / calendarsDistributed)
                : "0€"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Par calendrier</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions principales - Pattern shadcn moderne */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold mb-3">Actions rapides</h3>
        </div>

        {/* Action primaire - GROS bouton */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-lg">Enregistrer un don</h4>
                <p className="text-sm text-muted-foreground">
                  Don simple ou avec reçu fiscal
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <PaymentCardModal tourneeId={tournee.id} />
              <ReceiptGenerationModal tourneeId={tournee.id} />
            </div>
          </CardContent>
        </Card>

        {/* Action secondaire - Plus discrète */}
        <Card className="border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Clôturer la tournée</h4>
                <p className="text-xs text-muted-foreground">
                  Terminer et finaliser la collecte
                </p>
              </div>
              <div className="shrink-0">
                {retributionEnabled ? (
                  <TourneeClotureModal
                    trigger={
                      <Button variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
                        Clôturer
                      </Button>
                    }
                    tourneeData={{ tournee, transactions, summary }}
                    tourneeSummary={summary}
                  />
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Rétribution désactivée
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions - Pattern shadcn avec Avatar et Separator */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Activité récente</h3>
            <Badge variant="secondary">{transactions.length}</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              {transactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(transaction.supporter_name || "A")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.supporter_name || "Anonyme"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.created_at
                            ? new Date(transaction.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                          {" • "}
                          {transaction.calendar_accepted ? "Don simple" : "Reçu fiscal"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {transaction.supporter_email && (
                        <ResendReceiptButton transactionId={transaction.id} />
                      )}
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {currency.format(transaction.amount || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < Math.min(transactions.length, 5) - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {transactions.length > 5 && (
            <p className="text-center text-sm text-muted-foreground">
              +{transactions.length - 5} autres transactions
            </p>
          )}
        </div>
      )}

      {/* Empty state si pas de transactions */}
      {transactions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Aucune transaction</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez à enregistrer des dons pour voir l&apos;activité ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
 
