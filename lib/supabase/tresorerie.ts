import { createClient } from "@/lib/supabase/server";


export type TresorerieKPIs = {
    montantCollecteMois: number;
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    try {
        // 1. Montant collecté ce mois (tournées terminées)
        const { data: tourneesMois, error: errorTournees } = await supabase
            .from('tournees')
            .select('montant_collecte')
            .eq('statut', 'completed')
            .gte('date_fin', startOfMonth)
            .lte('date_fin', endOfMonth);

        if (errorTournees) throw errorTournees;
        const montantCollecteMois = tourneesMois?.reduce((sum, t) => sum + (t.montant_collecte || 0), 0) || 0;

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
            montantCollecteMois,
            tourneesActives: tourneesActives || 0,
            demandesEnAttente: demandesEnAttente || 0,
            soldeTotalPompiers,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des KPIs trésorerie:', error);
        return {
            montantCollecteMois: 0,
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
        const { data, error } = await supabase
            .from('demandes_versement')
            .select(`
        id,
        user_id,
        montant,
        type_versement,
        created_at,
        statut,
        profiles:user_id (
          full_name,
          first_name,
          last_name
        ),
        equipes:equipe_id (
          nom
        )
      `)
            .eq('statut', 'en_attente')
            .order('created_at', { ascending: true })
            .returns<DemandeVersementResponse[]>();

        if (error) throw error;

        return (data || []).map((d) => ({
            id: d.id,
            user_id: d.user_id,
            user_name: d.profiles?.full_name || `${d.profiles?.first_name || ''} ${d.profiles?.last_name || ''}`.trim() || 'Inconnu',
            equipe_nom: d.equipes?.nom || null,
            montant: d.montant,
            type_versement: d.type_versement as DemandeVersement['type_versement'],
            created_at: d.created_at,
            statut: d.statut as DemandeVersement['statut'],
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes en attente:', error);
        return [];
    }
}
