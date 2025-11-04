import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { formatCurrency, formatDateLong } from "@/lib/formatters";
import { getUserCompte, getPotEquipe, getMouvementsRetribution } from "@/lib/supabase/compte";
import { getEquipeWithSettingsFromProfile } from "@/lib/supabase/equipes";

export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Récupération des données via les helpers
  const [compte, eqWithSettings, mouvements] = await Promise.all([
    getUserCompte(supabase, user.id),
    getEquipeWithSettingsFromProfile(supabase, user.id),
    getMouvementsRetribution(supabase, user.id, 5),
  ]);

  const recommandationEquipe = eqWithSettings?.pourcentage_recommande_pot ?? 30;

  // Pot d'équipe (si équipe présente)
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single();

  const teamId = (profile as unknown as { team_id?: string | null })?.team_id;
  const potEquipe = teamId ? await getPotEquipe(supabase, teamId) : null;

  return (
    <PwaContainer>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mon Compte</h1>
              <p className="text-sm text-muted-foreground">Vos soldes et votre historique de rétribution</p>
            </div>
            <Badge variant="outline">Bêta</Badge>
          </div>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">💰 Mon solde</div>
              <div className="text-3xl font-bold">{formatCurrency(compte?.solde_disponible)}</div>
              <div className="text-xs text-muted-foreground mt-2">Disponible maintenant</div>
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

        {/* Pot d'équipe (collapsible) */}
        {potEquipe && (
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">👥 Pot d&apos;équipe</div>
                <div className="text-2xl font-bold">{formatCurrency(potEquipe.solde_disponible)}</div>
              </div>
              <div className="text-xs text-muted-foreground">Transparence: {eqWithSettings?.mode_transparence || '—'}</div>
            </summary>
            <div className="p-4 border-t text-sm text-muted-foreground">
              Détails des contributions disponibles selon le mode de transparence de l&apos;équipe.
            </div>
          </details>
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
