import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Soldes personnels
  const { data: compte } = await supabase
    .from('comptes_sp')
    .select('solde_disponible, total_retributions, pourcentage_pot_equipe_defaut')
    .eq('user_id', user.id)
    .single();

  // Paramètres d'équipe (min/reco + infos utiles)
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id, equipes(id, nom, mode_transparence, pourcentage_minimum_pot, pourcentage_recommande_pot)')
    .eq('id', user.id)
    .single();
  type EqSettings = { pourcentage_minimum_pot?: number; pourcentage_recommande_pot?: number };
  const eqRaw = (profile as unknown as { equipes?: (EqSettings & { id?: string; nom?: string; mode_transparence?: string }) | (EqSettings & { id?: string; nom?: string; mode_transparence?: string })[] })?.equipes;
  const eqObj: (EqSettings & { id?: string; nom?: string; mode_transparence?: string }) | undefined = Array.isArray(eqRaw) ? eqRaw[0] : eqRaw;
  const recommandationEquipe = eqObj?.pourcentage_recommande_pot ?? 30;

  // Pot d'équipe (si équipe présente)
  type ProfileWithTeam = { team_id?: string | null };
  const prof = profile as unknown as ProfileWithTeam;
  let potEquipe: { solde_disponible: number } | null = null;
  if (prof?.team_id) {
    const { data: pot } = await supabase
      .from('pots_equipe')
      .select('solde_disponible')
      .eq('equipe_id', prof.team_id)
      .single();
    potEquipe = pot || null;
  }

  // Derniers mouvements
  const { data: mouvements } = await supabase
    .from('mouvements_retribution')
    .select('created_at, montant_total_collecte, montant_compte_perso')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const fmt = new Intl.NumberFormat("fr-FR", { style: 'currency', currency: 'EUR' });
  const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mon Compte</h1>
            <p className="text-sm text-muted-foreground">Vos soldes et votre historique de rétribution</p>
          </div>
          <Badge variant="outline">Bêta</Badge>
        </div>
      </div>

      {/* Si l'utilisateur n'a pas encore de compte (pas de clôture) */}
      {!compte && (
        <Alert variant="warning">
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
            <div className="text-3xl font-bold">{fmt.format(Number(compte?.solde_disponible || 0))}</div>
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
        <details className="rounded-lg border border-border bg-card">
          <summary className="cursor-pointer px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">👥 Pot d&apos;équipe</div>
              <div className="text-2xl font-bold">{fmt.format(Number(potEquipe.solde_disponible || 0))}</div>
            </div>
            <div className="text-xs text-muted-foreground">Transparence: {eqObj?.mode_transparence || '—'}</div>
          </summary>
          <div className="p-4 border-t border-border text-sm text-muted-foreground">
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
                  {fmtDate.format(new Date(m.created_at as string))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{fmt.format(Number(m.montant_total_collecte || 0))} collectés</span>
                  <span className="font-semibold">{fmt.format(Number(m.montant_compte_perso || 0))} pour moi</span>
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
            <Link href="/dashboard/parametres">
              <Button variant="secondary">Ouvrir</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
