import { createClient } from "@/lib/supabase/server";


export type TresorerieKPIs = {
    montantCollecteTotal: number;
    tourneesActives: number;
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

// Type helper pour la réponse de la requête
type DemandeVersementResponse = {
    id: string;
    user_id: string;
    montant: number;
    type_versement: 'virement' | 'carte_cadeau';
    created_at: string;
    statut: 'en_attente' | 'en_cours' | 'validee' | 'payee' | 'rejetee';
    profiles: {
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
    } | null;
    equipes: {
        nom: string;
    } | null;
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

        // 2. Tournées actives
        const { count: tourneesActives, error: errorActives } = await supabase
            .from('tournees')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'active');

        if (errorActives) throw errorActives;

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
            tourneesActives: tourneesActives || 0,
            demandesEnAttente: demandesEnAttente || 0,
            soldeTotalPompiers,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des KPIs trésorerie:', error);
        return {
            montantCollecteTotal: 0,
            tourneesActives: 0,
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
