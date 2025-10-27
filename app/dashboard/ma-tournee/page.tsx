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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

// Mini composant stat (utilisé pour mobile et desktop)
function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-2 pb-2">
        <CardTitle className="min-w-0 text-sm font-medium truncate">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-2 truncate">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function MaTourneePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const tourneeData = await getActiveTourneeWithTransactions();

  if (!tourneeData) redirect("/dashboard/calendriers");

  const { tournee, transactions, summary } = tourneeData;

  if (!tournee) redirect("/dashboard/calendriers");

  const duration = calculateDuration(tournee.date_debut);
  const calendarsDistributed = summary?.calendars_distributed || 0;
  const amountCollected = summary?.montant_total || 0;

  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const average =
    calendarsDistributed > 0
      ? currency.format(amountCollected / calendarsDistributed)
      : "0€";

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
    <div className="space-y-6 pb-24 sm:pb-8 w-full">
      {/* Header - mobile first, compact */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Ma Tournée</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tournee.zone}</span>
              </div>
              <span className="text-muted-foreground/40">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
            <div className="pt-1">
              <RoleBadge />
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex shrink-0">
            <TrendingUp className="mr-1 h-3 w-3" />
            En cours
          </Badge>
        </div>
      </div>

      <Separator />

      {/* METRIQUES – grille responsive explicite (cols 1 → 2 → 3) */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid gap-4 grid-cols-2 max-[350px]:grid-cols-1 lg:grid-cols-3">
          <StatCard
            icon={Wallet}
            label="Montant Collecté"
            value={currency.format(amountCollected)}
          />
          <StatCard
            icon={Calendar}
            label="Calendriers"
            value={String(calendarsDistributed)}
            hint="Distribués aujourd’hui"
          />
          <StatCard
            icon={TrendingUp}
            label="Moyenne"
            value={average}
            hint="Par calendrier"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="hidden sm:block">
          <h3 className="text-lg font-semibold mb-3">Actions rapides</h3>
        </div>

        {/* Desktop/tablette: carte “grosse” d’action */}
        <Card className="border-2 border-primary hover:border-primary/80 transition-all hidden sm:block">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="font-semibold text-base sm:text-lg">
                  Enregistrer un don
                </h4>
                <p className="text-sm text-muted-foreground">
                  Don simple ou avec reçu fiscal
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary shrink-0" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <PaymentCardModal tourneeId={tournee.id} />
              <ReceiptGenerationModal tourneeId={tournee.id} />
            </div>
          </CardContent>
        </Card>

        {/* Clôture - visible partout */}
        <Card className="border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="font-medium">Clôturer la tournée</h4>
                <p className="text-xs text-muted-foreground">
                  Terminer et finaliser la collecte
                </p>
              </div>
              <div className="shrink-0">
                {retributionEnabled ? (
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
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Désactivée
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
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
                  <div className="flex items-center justify-between gap-3 p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
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
                            ? new Date(transaction.created_at).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : "N/A"}
                          {" • "}
                          {transaction.calendar_accepted ? "Don simple" : "Reçu fiscal"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-right min-w-[64px]">
                      {transaction.supporter_email && (
                        <ResendReceiptButton transactionId={transaction.id} />
                      )}
                      <div className="text-right w-full">
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

      {/* Empty state */}
      {transactions.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Aucune transaction</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Commencez à enregistrer des dons pour voir l’activité ici
            </p>
          </CardContent>
        </Card>
      )}

      {/* Barre d’action mobile (collante) */}
      <div className="sm:hidden fixed inset-x-0 bottom-3 z-40 px-4">
        <div className="rounded-xl border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 flex gap-2">
          {/* Astuce: si les modals génèrent des <button>, elles s’adapteront à la largeur disponible */}
          <div className="flex-1">
            <PaymentCardModal 
              tourneeId={tournee.id}
              trigger={<Button className="w-full">Paiement CB</Button>}
            />
          </div>
          <div className="flex-1">
            <ReceiptGenerationModal 
              tourneeId={tournee.id}
              trigger={<Button variant="outline" className="w-full">Reçu fiscal</Button>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}