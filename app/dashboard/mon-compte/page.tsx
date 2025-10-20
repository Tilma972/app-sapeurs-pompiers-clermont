import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function MonComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Soldes personnels
  const { data: compte } = await supabase
    .from('comptes_sp')
    .select('solde_disponible, solde_utilise, solde_bloque, total_retributions, total_contributions_equipe')
    .eq('user_id', user.id)
    .single();

  // Derniers mouvements
  const { data: mouvements } = await supabase
    .from('mouvements_retribution')
    .select('created_at, montant_total_collecte, montant_amicale, montant_pompier_total, pourcentage_pot_equipe, montant_pot_equipe, montant_compte_perso')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const fmt = new Intl.NumberFormat("fr-FR", { style: 'currency', currency: 'EUR' });

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Solde disponible</CardTitle>
            <CardDescription>Utilisable immédiatement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt.format(Number(compte?.solde_disponible || 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total rétribué</CardTitle>
            <CardDescription>Cumul des versements perçus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt.format(Number(compte?.total_retributions || 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contribution à l&apos;équipe</CardTitle>
            <CardDescription>Cumul versé au pot d&apos;équipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt.format(Number(compte?.total_contributions_equipe || 0))}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des mouvements</CardTitle>
          <CardDescription>Dernières clôtures de tournée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(mouvements || []).length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun mouvement pour le moment.</div>
            )}
            {(mouvements || []).map((m, idx) => (
              <div key={idx} className="p-3 rounded border border-border">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {new Date(m.created_at as string).toLocaleString('fr-FR')}
                  </div>
                  <div className="font-medium">{fmt.format(Number(m.montant_pompier_total || 0))} pompier</div>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amicale (70%)</span>
                    <span className="font-medium">{fmt.format(Number(m.montant_amicale || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pot d&apos;équipe ({m.pourcentage_pot_equipe}%)</span>
                    <span className="font-medium">{fmt.format(Number(m.montant_pot_equipe || 0))}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span>Mon compte</span>
                    <span className="font-semibold">{fmt.format(Number(m.montant_compte_perso || 0))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
