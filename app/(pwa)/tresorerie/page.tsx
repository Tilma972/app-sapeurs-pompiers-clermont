import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isTreasurerRole } from "@/lib/config";
import { getTresorerieKPIs, getDemandesEnAttente } from "@/lib/supabase/tresorerie";
import { getToutesDemandesDepot } from "@/lib/supabase/depot-fonds";
import { TresorerieKPI } from "@/components/tresorerie/tresorerie-kpi";
import { DemandesEnAttenteListe } from "@/components/tresorerie/demandes-en-attente-liste";
import { DemandesDepotTable } from "@/components/tresorerie/demandes-depot-table";
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
  const [kpis, demandesEnAttente, demandesDepot] = await Promise.all([
    getTresorerieKPIs(),
    getDemandesEnAttente(),
    getToutesDemandesDepot(supabase).catch(() => []),
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
          <h2 className="text-xl font-semibold tracking-tight">
            Dépôts de fonds collectés
          </h2>
          <DemandesDepotTable demandes={demandesDepot} />
        </div>

        {/* Demandes de versement en attente */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Demandes de versement en attente
          </h2>
          <DemandesEnAttenteListe demandes={demandesEnAttente} />
        </div>
      </div>
    </PwaContainer>
  );
}
