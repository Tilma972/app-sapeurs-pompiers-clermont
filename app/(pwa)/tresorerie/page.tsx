import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isTreasurerRole } from "@/lib/config";
import { getTresorerieKPIs, getDemandesEnAttente, getEquipesPotSummary } from "@/lib/supabase/tresorerie";
import { getToutesDemandesDepot } from "@/lib/supabase/depot-fonds";
import { getAllDemandesPot } from "@/lib/supabase/pot-depenses";
import { TresorerieKPI } from "@/components/tresorerie/tresorerie-kpi";
import { DemandesEnAttenteListe } from "@/components/tresorerie/demandes-en-attente-liste";
import { DemandesDepotTable } from "@/components/tresorerie/demandes-depot-table";
import { EnregistrerDepotDirectButton } from "@/components/tresorerie/enregistrer-depot-direct-button";
import { SoldesAnterieursSection } from "@/components/tresorerie/soldes-anterieurs-section";
import { DemandesPotTresorier } from "@/components/pot-depenses/demandes-pot-tresorier";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";

export default async function TresoreriePage() {
  const supabase = await createClient();

  // 1. Vérification Auth & Rôle
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !isTreasurerRole(profile.role)) {
    redirect("/dashboard");
  }

  // 2. Récupération des données
  const anneeCampagne = new Date().getFullYear();
  const [kpis, demandesEnAttente, demandesDepot, equipesPotSummary, demandesPot] = await Promise.all([
    getTresorerieKPIs(),
    getDemandesEnAttente(),
    getToutesDemandesDepot(supabase).catch(() => []),
    getEquipesPotSummary(anneeCampagne).catch(() => []),
    getAllDemandesPot(supabase).catch(() => []),
  ]);

  return (
    <PwaContainer>
      <div className="space-y-8 py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trésorerie</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble et gestion des demandes
          </p>
        </div>

        {/* KPIs */}
        <TresorerieKPI kpis={kpis} />

        {/* Demandes de dépôt de fonds */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Dépôts de fonds collectés
            </h2>
            <EnregistrerDepotDirectButton />
          </div>
          <DemandesDepotTable demandes={demandesDepot} />
        </div>

        {/* Demandes de versement en attente */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Demandes de versement en attente
          </h2>
          <DemandesEnAttenteListe demandes={demandesEnAttente} />
        </div>

        {/* Soldes antérieurs par équipe */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Soldes antérieurs par équipe
          </h2>
          <SoldesAnterieursSection summaries={equipesPotSummary} annee={anneeCampagne} />
        </div>

        {/* Dépenses pot d'équipe */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Dépenses pot d&apos;équipe
          </h2>
          <DemandesPotTresorier demandes={demandesPot} />
        </div>
      </div>
    </PwaContainer>
  );
}
