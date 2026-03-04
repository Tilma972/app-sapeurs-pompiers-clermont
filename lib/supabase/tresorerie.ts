import { createClient } from "@/lib/supabase/server";
import { EquipePotSummary } from "@/lib/types";


export type TresorerieKPIs = {
    montantCollecteTotal: number;
    montantTotalDepose: number;
    demandesEnAttente: number;
    soldeTotalPompiers: number;
};

export type DemandeVersement = {
    id: string;
    user_id: string;
    user_name: string;
    equipe_nom: string | null;
    montant: number;
    type_versement: 'virement' | 'carte_cadeau';
    created_at: string;
    statut: 'en_attente' | 'en_cours' | 'validee' | 'payee' | 'rejetee';
};

/**
 * Récupère les KPIs pour le dashboard trésorerie
 */
export async function getTresorerieKPIs(): Promise<TresorerieKPIs> {
    const supabase = await createClient();

    try {
        // 1. Montant total collecté (toutes les tournées terminées de la campagne)
        const { data: tourneesCompleted, error: errorTournees } = await supabase
            .from('tournees')
            .select('montant_collecte')
            .eq('statut', 'completed');

        if (errorTournees) throw errorTournees;
        const montantCollecteTotal = tourneesCompleted?.reduce((sum, t) => sum + (t.montant_collecte || 0), 0) || 0;

        // 2. Montant total déposé (somme des dépôts validés)
        const { data: depotsValides, error: errorDepots } = await supabase
            .from('demandes_depot_fonds')
            .select('montant_recu')
            .eq('statut', 'valide');

        if (errorDepots) throw errorDepots;
        const montantTotalDepose = depotsValides?.reduce((sum, d) => sum + (d.montant_recu || 0), 0) || 0;

        // 3. Demandes en attente
        const { count: demandesEnAttente, error: errorDemandes } = await supabase
            .from('demandes_versement')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'en_attente');

        if (errorDemandes) throw errorDemandes;

        // 4. Solde total pompiers
        const { data: comptesSp, error: errorComptes } = await supabase
            .from('comptes_sp')
            .select('solde_disponible');

        if (errorComptes) throw errorComptes;
        const soldeTotalPompiers = comptesSp?.reduce((sum, c) => sum + (c.solde_disponible || 0), 0) || 0;

        return {
            montantCollecteTotal,
            montantTotalDepose,
            demandesEnAttente: demandesEnAttente || 0,
            soldeTotalPompiers,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des KPIs trésorerie:', error);
        return {
            montantCollecteTotal: 0,
            montantTotalDepose: 0,
            demandesEnAttente: 0,
            soldeTotalPompiers: 0,
        };
    }
}

/**
 * Récupère la liste des demandes de versement en attente
 */
export async function getDemandesEnAttente(): Promise<DemandeVersement[]> {
    const supabase = await createClient();

    try {
        // Get demandes_versement
        const { data: demandes, error: demandesError } = await supabase
            .from('demandes_versement')
            .select('id, user_id, montant, type_versement, created_at, statut, equipe_id')
            .eq('statut', 'en_attente')
            .order('created_at', { ascending: true });

        if (demandesError) throw demandesError;
        if (!demandes || demandes.length === 0) return [];

        // Get unique user_ids and equipe_ids
        const userIds = [...new Set(demandes.map(d => d.user_id))];
        const equipeIds = [...new Set(demandes.map(d => d.equipe_id).filter(Boolean))];

        // Fetch profiles
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, first_name, last_name')
            .in('id', userIds);

        // Fetch equipes
        const { data: equipes } = equipeIds.length > 0
            ? await supabase
                .from('equipes')
                .select('id, nom')
                .in('id', equipeIds)
            : { data: [] };

        // Create lookup maps
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const equipeMap = new Map(equipes?.map(e => [e.id, e]) || []);

        // Map results
        return demandes.map((d) => {
            const profile = profileMap.get(d.user_id);
            const equipe = d.equipe_id ? equipeMap.get(d.equipe_id) : null;

            return {
                id: d.id,
                user_id: d.user_id,
                user_name: profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Inconnu',
                equipe_nom: equipe?.nom || null,
                montant: d.montant,
                type_versement: d.type_versement as DemandeVersement['type_versement'],
                created_at: d.created_at,
                statut: d.statut as DemandeVersement['statut'],
            };
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes en attente:', error);
        return [];
    }
}

/**
 * Récupère toutes les équipes ayant la rétribution activée
 * avec leur pot campagne calculé et le solde antérieur saisi
 * Utilisé dans le dashboard trésorier pour la saisie des soldes antérieurs
 */
export async function getEquipesPotSummary(annee: number): Promise<EquipePotSummary[]> {
    const supabase = await createClient();

    try {
        // 1. Équipes actives avec rétribution activée
        const { data: equipes, error: equipeError } = await supabase
            .from('equipes')
            .select('id, nom')
            .eq('actif', true)
            .eq('enable_retribution', true)
            .order('nom');

        if (equipeError) throw equipeError;
        if (!equipes || equipes.length === 0) return [];

        const equipeIds = equipes.map((e) => e.id);

        // 2. Tournées complétées pour ces équipes
        const { data: tournees, error: tourneeError } = await supabase
            .from('tournees')
            .select('equipe_id, montant_collecte, date_debut')
            .in('equipe_id', equipeIds)
            .eq('statut', 'completed');

        if (tourneeError) throw tourneeError;

        // 3. Soldes antérieurs pour l'année donnée
        const { data: historiques, error: histError } = await supabase
            .from('pots_equipe_historique')
            .select('id, equipe_id, solde_anterieur')
            .in('equipe_id', equipeIds)
            .eq('annee', annee);

        if (histError) throw histError;

        // Index pour accès rapide
        const histMap = new Map(
            (historiques ?? []).map((h) => [h.equipe_id, h])
        );

        // 4. Calculer le pot campagne par équipe
        const tourneesParEquipe = new Map<string, { total: number; maxDate: string | null }>();
        for (const t of tournees ?? []) {
            const current = tourneesParEquipe.get(t.equipe_id) ?? { total: 0, maxDate: null };
            const newTotal = current.total + (t.montant_collecte ?? 0);
            const newDate =
                t.date_debut && (!current.maxDate || t.date_debut > current.maxDate)
                    ? t.date_debut
                    : current.maxDate;
            tourneesParEquipe.set(t.equipe_id, { total: newTotal, maxDate: newDate });
        }

        return equipes.map((equipe) => {
            const tourneeData = tourneesParEquipe.get(equipe.id);
            const part_equipe_campagne = (tourneeData?.total ?? 0) * 0.30;

            const annee_campagne = tourneeData?.maxDate
                ? new Date(tourneeData.maxDate).getFullYear()
                : annee;

            const hist = histMap.get(equipe.id);
            const solde_anterieur = hist?.solde_anterieur ?? 0;

            return {
                equipe_id: equipe.id,
                equipe_nom: equipe.nom,
                part_equipe_campagne,
                annee_campagne,
                solde_anterieur,
                total_disponible: part_equipe_campagne + solde_anterieur,
                historique_id: hist?.id ?? null,
            };
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des pots équipe:', error);
        return [];
    }
}
