import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { formatCurrency, formatDateLong } from "@/lib/formatters";
import { getUserCompte, getMouvementsRetribution, getPotEquipeTournees } from "@/lib/supabase/compte";
import { getUserDemandes } from "@/lib/supabase/versement";
import { getEquipeWithSettingsFromProfile } from "@/lib/supabase/equipes";
import { RETRIBUTION_CONFIG, PAGINATION_CONFIG, VERSEMENT_CONFIG } from "@/lib/config";
import { DemandesListe } from "@/components/compte/demandes-liste";
import { getMontantNonDepose, getDemandesDepotUtilisateur, getDetailFondsUtilisateur } from "@/lib/supabase/depot-fonds";
import { DemandesDepotListe } from "@/components/compte/demandes-depot-liste";
import { DetailFondsCard } from "@/components/compte/detail-fonds-card";

export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Récupération des données via les helpers
  const [compte, eqWithSettings, mouvements, demandes, montantNonDepose, demandesDepot, detailFonds] = await Promise.all([
    getUserCompte(supabase, user.id),
    getEquipeWithSettingsFromProfile(supabase, user.id),
    getMouvementsRetribution(supabase, user.id, PAGINATION_CONFIG.MOUVEMENTS_RETRIBUTION_LIMIT),
    getUserDemandes(supabase, user.id, 5),
    getMontantNonDepose(supabase, user.id).catch(() => 0),
    getDemandesDepotUtilisateur(supabase, user.id).catch(() => []),
    getDetailFondsUtilisateur(supabase, user.id).catch(() => ({ total_collecte: 0, total_cb_valide: 0, total_cash_depose: 0, cash_a_deposer: 0 })),
  ]);

  const recommandationEquipe = eqWithSettings?.pourcentage_recommande_pot ?? RETRIBUTION_CONFIG.RECOMMANDE_POT_EQUIPE_DEFAULT;

  // Pot d'équipe calculé depuis les tournées (uniquement si équipe existe)
  const potEquipeTournees = eqWithSettings?.id
    ? await getPotEquipeTournees(supabase, eqWithSettings.id)
    : null;

  // Historique filtré sur la campagne 2025 (tournées débutées entre nov 2024 et jan 2025)
  const mouvements2025 = (mouvements ?? []).filter((m) => {
    const d = new Date(m.created_at as string);
    return d >= new Date('2024-11-01') && d <= new Date('2025-01-31');
  });

  const afficherPotEquipe = eqWithSettings && potEquipeTournees && potEquipeTournees.total_collecte > 0;

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Mon Compte</h1>
            </div>
            <Badge variant="outline">Bêta</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vos soldes et votre historique de rétribution
          </p>
        </div>

        {/* Alertes contextuelles */}
        {!compte && (
          <Alert>
            <AlertTitle>Pas encore de compte</AlertTitle>
            <AlertDescription>
              Vous n&apos;avez pas encore de solde personnel. Effectuez une première clôture de tournée pour initialiser votre compte.
            </AlertDescription>
          </Alert>
        )}
        {!eqWithSettings && (
          <Alert>
            <AlertTitle>Pas encore d&apos;équipe</AlertTitle>
            <AlertDescription>
              Vous n&apos;êtes rattaché à aucune équipe. Contactez un administrateur pour rejoindre une équipe et bénéficier du pot collectif.
            </AlertDescription>
          </Alert>
        )}

        {/* Niveau 1 — Métriques principales */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">💰 Mon solde</div>
            <div className="text-3xl font-bold">{formatCurrency(compte?.solde_disponible)}</div>
            <div className="text-xs text-muted-foreground mt-2">Disponible maintenant</div>
          </CardContent>
        </Card>

        {afficherPotEquipe && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="text-sm font-medium">🏆 Pot d&apos;équipe</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Campagne {potEquipeTournees!.annee_campagne}</span>
                  <span className="font-semibold">{formatCurrency(potEquipeTournees!.part_equipe)}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground font-medium">Total disponible</span>
                  <span className="font-bold">{formatCurrency(potEquipeTournees!.part_equipe)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Niveau 2 — Actions */}
        {montantNonDepose > 0 && (
          <Card className="border-orange-500/20 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">🏦 Demander un dépôt de fonds</div>
                  <div className="text-xs text-muted-foreground">
                    Organisez un RDV pour remettre les {formatCurrency(montantNonDepose)} collectés
                  </div>
                </div>
                <Link href="/mon-compte/demander-depot">
                  <Button size="sm" className="gap-2" variant="default">
                    <Plus className="h-4 w-4" />
                    Demander un dépôt
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {compte && compte.solde_disponible && compte.solde_disponible >= VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">💳 Demander un versement</div>
                  <div className="text-xs text-muted-foreground">
                    Recevez votre rétribution par virement ou carte cadeau
                  </div>
                </div>
                <Link href="/mon-compte/demander-versement">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvelle demande
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Niveau 3 — Détails collapsed par défaut */}
        {detailFonds.total_collecte > 0 && (
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-medium">📋 Détail de vos fonds collectés</span>
              <span className="text-sm font-semibold">{formatCurrency(detailFonds.total_collecte)}</span>
            </summary>
            <div className="px-6 pb-4">
              <DetailFondsCard detail={detailFonds} />
            </div>
          </details>
        )}

        {mouvements2025.length > 0 && (
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-medium">📊 Historique des tournées</span>
              <span className="text-xs text-muted-foreground">{mouvements2025.length} tournée{mouvements2025.length > 1 ? 's' : ''}</span>
            </summary>
            <div className="px-6 pb-4 space-y-2">
              {mouvements2025.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="text-muted-foreground">
                    {formatDateLong(m.created_at as string)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatCurrency(m.montant_total_collecte)} collectés</span>
                    <span className="font-semibold">{formatCurrency(m.montant_compte_perso)} pour moi</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Niveau 4 — Bas de page : config et historique administratif */}
        {demandes && demandes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes demandes de versement</h2>
              <Badge variant="outline">{demandes.length}</Badge>
            </div>
            <DemandesListe demandes={demandes} />
          </div>
        )}

        {demandesDepot && demandesDepot.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes demandes de dépôt</h2>
              <Badge variant="outline">{demandesDepot.length}</Badge>
            </div>
            <DemandesDepotListe demandes={demandesDepot} />
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">🎯 Ma préférence de répartition</div>
                <div className="text-2xl font-bold">{(compte?.pourcentage_pot_equipe_defaut ?? recommandationEquipe)}%</div>
                <div className="text-xs text-muted-foreground mt-1">Part au pot d&apos;équipe</div>
              </div>
              <Link href="/parametres">
                <Button variant="secondary" size="sm">Modifier</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PwaContainer>
  );
}
