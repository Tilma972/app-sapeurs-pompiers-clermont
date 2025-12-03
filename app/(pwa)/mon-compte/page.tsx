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
import { getUserCompte, getPotEquipe, getMouvementsRetribution } from "@/lib/supabase/compte";
import { getUserDemandes } from "@/lib/supabase/versement";
import { getEquipeWithSettingsFromProfile } from "@/lib/supabase/equipes";
import { RETRIBUTION_CONFIG, PAGINATION_CONFIG, VERSEMENT_CONFIG } from "@/lib/config";
import { DemandesListe } from "@/components/compte/demandes-liste";
import { getMontantNonDepose, getDemandesDepotUtilisateur } from "@/lib/supabase/depot-fonds";
import { DemandesDepotListe } from "@/components/compte/demandes-depot-liste";

export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Récupération des données via les helpers
  const [compte, eqWithSettings, mouvements, demandes, montantNonDepose, demandesDepot] = await Promise.all([
    getUserCompte(supabase, user.id),
    getEquipeWithSettingsFromProfile(supabase, user.id),
    getMouvementsRetribution(supabase, user.id, PAGINATION_CONFIG.MOUVEMENTS_RETRIBUTION_LIMIT),
    getUserDemandes(supabase, user.id, 5),
    getMontantNonDepose(supabase, user.id).catch(() => 0),
    getDemandesDepotUtilisateur(supabase, user.id).catch(() => []),
  ]);

  const recommandationEquipe = eqWithSettings?.pourcentage_recommande_pot ?? RETRIBUTION_CONFIG.RECOMMANDE_POT_EQUIPE_DEFAULT;

  // Pot d'équipe (uniquement si équipe existe)
  const potEquipe = eqWithSettings?.id 
    ? await getPotEquipe(supabase, eqWithSettings.id) 
    : null;

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

        {/* Si l'utilisateur n'a pas encore de compte (pas de clôture) */}
        {!compte && (
          <Alert>
            <AlertTitle>Pas encore de compte</AlertTitle>
            <AlertDescription>
              Vous n&apos;avez pas encore de solde personnel. Effectuez une première clôture de tournée pour initialiser votre compte.
            </AlertDescription>
          </Alert>
        )}

        {/* Si l'utilisateur n'a pas d'équipe */}
        {!eqWithSettings && (
          <Alert>
            <AlertTitle>Pas encore d&apos;équipe</AlertTitle>
            <AlertDescription>
              Vous n&apos;êtes rattaché à aucune équipe. Contactez un administrateur pour rejoindre une équipe et bénéficier du pot collectif.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">💰 Mon solde</div>
              <div className="text-3xl font-bold">{formatCurrency(compte?.solde_disponible)}</div>
              <div className="text-xs text-muted-foreground mt-2">Disponible maintenant</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">🏦 Fonds non déposés</div>
              <div className="text-3xl font-bold">{formatCurrency(montantNonDepose)}</div>
              <div className="text-xs text-muted-foreground mt-2">À remettre au trésorier</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">🎯 Ma préférence</div>
              <div className="text-3xl font-bold">{(compte?.pourcentage_pot_equipe_defaut ?? recommandationEquipe)}%</div>
              <div className="text-xs text-muted-foreground mt-2">Part au pot d&apos;équipe</div>
            </CardContent>
          </Card>
        </div>

        {/* Pot d'équipe (collapsible) - Affiché seulement si équipe ET pot existent */}
        {eqWithSettings && potEquipe && (
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">👥 Pot d&apos;équipe</div>
                <div className="text-2xl font-bold">{formatCurrency(potEquipe.solde_disponible)}</div>
              </div>
              <div className="text-xs text-muted-foreground">Transparence: {eqWithSettings.mode_transparence || '—'}</div>
            </summary>
            <div className="p-4 border-t text-sm text-muted-foreground">
              Détails des contributions disponibles selon le mode de transparence de l&apos;équipe.
            </div>
          </details>
        )}

        {/* Action: Demander un dépôt de fonds */}
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

        {/* Action: Demander un versement */}
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

        {/* Mes demandes de dépôt de fonds */}
        {demandesDepot && demandesDepot.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes demandes de dépôt</h2>
              <Badge variant="outline">{demandesDepot.length}</Badge>
            </div>
            <DemandesDepotListe demandes={demandesDepot} />
          </div>
        )}

        {/* Mes demandes de versement */}
        {demandes && demandes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes demandes de versement</h2>
              <Badge variant="outline">{demandes.length}</Badge>
            </div>
            <DemandesListe demandes={demandes} />
          </div>
        )}

        {(mouvements && mouvements.length > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="text-sm font-medium mb-3">📊 Historique récent</div>
              {(mouvements || []).map((m, idx) => (
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
            </CardContent>
          </Card>
        )}

        {/* Lien vers Paramètres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Paramètres</div>
                <div className="text-base">Gérer ma préférence de répartition</div>
              </div>
              <Link href="/parametres">
                <Button variant="secondary">Ouvrir</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PwaContainer>
  );
}
