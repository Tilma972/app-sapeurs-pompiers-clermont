import { createClient } from "@/lib/supabase/server";
import { 
  Tournee, 
  TourneeCreate, 
  TourneeUpdate, 
  TourneeStats,
  TourneeDetailedStats,
  UserTourneeStats
} from "@/lib/types/tournee";

/**
 * Crée une nouvelle tournée
 */
export async function createTournee(tourneeData: TourneeCreate): Promise<Tournee | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: tournee, error } = await supabase
    .from('tournees')
    .insert({
      user_id: user.id,
      ...tourneeData
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la tournée:', error);
    return null;
  }

  return tournee;
}

/**
 * Récupère une tournée par son ID
 */
export async function getTourneeById(tourneeId: string): Promise<Tournee | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: tournee, error } = await supabase
    .from('tournees')
    .select('*')
    .eq('id', tourneeId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de la tournée:', error);
    return null;
  }

  return tournee;
}

/**
 * Récupère la tournée active de l'utilisateur
 */
export async function getActiveTournee(): Promise<Tournee | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: tournee, error } = await supabase
    .from('tournees')
    .select('*')
    .eq('user_id', user.id)
    .eq('statut', 'active')
    .order('date_debut', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erreur lors de la récupération de la tournée active:', error);
    return null;
  }

  return tournee;
}

/**
 * Récupère toutes les tournées de l'utilisateur
 */
export async function getUserTournees(): Promise<Tournee[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data: tournees, error } = await supabase
    .from('tournees')
    .select('*')
    .eq('user_id', user.id)
    .order('date_debut', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des tournées:', error);
    return [];
  }

  return tournees || [];
}

/**
 * Met à jour une tournée
 */
export async function updateTournee(tourneeId: string, updates: TourneeUpdate): Promise<Tournee | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: tournee, error } = await supabase
    .from('tournees')
    .update(updates)
    .eq('id', tourneeId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la tournée:', error);
    return null;
  }

  return tournee;
}

/**
 * Clôture une tournée
 */
export async function cloturerTournee(tourneeId: string, calendriersFinaux: number, montantFinal: number): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('cloturer_tournee', {
    tournee_uuid: tourneeId,
    calendriers_finaux: calendriersFinaux,
    montant_final: montantFinal
  });

  if (error) {
    console.error('Erreur lors de la clôture de la tournée:', error);
    return false;
  }

  return data;
}

/**
 * Récupère les statistiques d'une tournée
 */
export async function getTourneeStats(tourneeId: string): Promise<TourneeStats | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_tournee_stats', {
    tournee_uuid: tourneeId
  });

  if (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Récupère les statistiques détaillées d'une tournée
 */
export async function getTourneeDetailedStats(tourneeId: string): Promise<TourneeDetailedStats | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_tournee_detailed_stats', {
    tournee_uuid: tourneeId
  });

  if (error) {
    console.error('Erreur lors de la récupération des statistiques détaillées:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Récupère les statistiques globales de l'utilisateur
 */
export async function getUserTourneeStats(): Promise<UserTourneeStats | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_user_tournee_stats', {
    user_uuid: user.id
  });

  if (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Crée une nouvelle tournée active pour l'utilisateur
 */
export async function createNewActiveTournee(zone: string = 'Zone par défaut'): Promise<Tournee | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  try {
    // Vérifier s'il y a déjà une tournée active
    const { data: existingTournee } = await supabase
      .from('tournees')
      .select('id')
      .eq('user_id', user.id)
      .eq('statut', 'active')
      .single();

    if (existingTournee) {
      console.log('Une tournée active existe déjà');
      return existingTournee as Tournee;
    }

    // Créer une nouvelle tournée active
    const { data: newTournee, error } = await supabase
      .from('tournees')
      .insert({
        user_id: user.id,
        date_debut: new Date().toISOString(),
        statut: 'active',
        zone: zone,
        calendriers_alloues: 50, // Valeur par défaut
        notes: 'Tournée créée automatiquement'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la tournée:', error);
      return null;
    }

    return newTournee;
  } catch (error) {
    console.error('Erreur dans createNewActiveTournee:', error);
    return null;
  }
}

/**
 * Récupère la tournée active avec ses transactions pour la page ma-tournee
 */
export async function getActiveTourneeWithTransactions(): Promise<{
  tournee: Tournee | null;
  transactions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  summary: any; // eslint-disable-line @typescript-eslint/no-explicit-any
} | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  try {
    // Récupérer la tournée active
    const { data: tournee, error: tourneeError } = await supabase
      .from('tournees')
      .select('*')
      .eq('user_id', user.id)
      .eq('statut', 'active')
      .order('date_debut', { ascending: false })
      .limit(1)
      .single();

    if (tourneeError && tourneeError.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération de la tournée active:', tourneeError);
      return null;
    }

    if (!tournee) {
      return {
        tournee: null,
        transactions: [],
        summary: null
      };
    }

    // Récupérer les transactions de la tournée
    const { data: transactions, error: transactionsError } = await supabase
      .from('support_transactions')
      .select('*')
      .eq('tournee_id', tournee.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Erreur lors de la récupération des transactions:', transactionsError);
      return {
        tournee,
        transactions: [],
        summary: null
      };
    }

    // Récupérer le résumé de la tournée
    const { data: summary, error: summaryError } = await supabase
      .from('tournee_summary')
      .select('*')
      .eq('tournee_id', tournee.id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du résumé:', summaryError);
    }

    return {
      tournee,
      transactions: transactions || [],
      summary: summary || null
    };

  } catch (error) {
    console.error('Erreur dans getActiveTourneeWithTransactions:', error);
    return null;
  }
}

/**
 * Récupère les statistiques personnelles de l'utilisateur
 */
export async function getUserPersonalStats(): Promise<{
  totalCalendarsDistributed: number;
  totalAmountCollected: number;
  averagePerCalendar: number;
} | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  try {
    // Récupérer les statistiques depuis la vue tournee_summary
    const { data: stats, error } = await supabase
      .from('tournee_summary')
      .select('calendars_distributed, montant_total')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur lors de la récupération des statistiques personnelles:', error);
      return null;
    }

    const totalCalendarsDistributed = stats?.reduce((sum, stat) => sum + (stat.calendars_distributed || 0), 0) || 0;
    const totalAmountCollected = stats?.reduce((sum, stat) => sum + (stat.montant_total || 0), 0) || 0;
    const averagePerCalendar = totalCalendarsDistributed > 0 ? totalAmountCollected / totalCalendarsDistributed : 0;

    return {
      totalCalendarsDistributed,
      totalAmountCollected,
      averagePerCalendar
    };
  } catch (error) {
    console.error('Erreur dans getUserPersonalStats:', error);
    return null;
  }
}

/**
 * Récupère l'historique personnel (3 dernières tournées terminées)
 */
export async function getUserHistory(): Promise<{
  id: string;
  date: string;
  calendarsDistributed: number;
  amountCollected: number;
}[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  try {
    // Récupérer les 3 dernières tournées terminées avec leurs statistiques
    const { data: tournees, error } = await supabase
      .from('tournees')
      .select(`
        id,
        date_fin,
        calendriers_distribues,
        montant_collecte
      `)
      .eq('user_id', user.id)
      .eq('statut', 'completed')
      .order('date_fin', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }

    return tournees?.map((tournee: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: tournee.id,
      date: tournee.date_fin || tournee.date_debut || new Date().toISOString(),
      calendarsDistributed: tournee.calendriers_distribues || 0,
      amountCollected: tournee.montant_collecte || 0
    })) || [];
  } catch (error) {
    console.error('Erreur dans getUserHistory:', error);
    return [];
  }
}

/**
 * Récupère le résumé des équipes pour le graphique
 */
export async function getTeamsSummary(): Promise<{
  team: string;
  totalCalendarsDistributed: number;
  totalAmountCollected: number;
}[]> {
  const supabase = await createClient();

  try {
    // Essayer d'abord la vue tournee_summary
    let stats, error;
    
    try {
      // Essayer d'abord la vue tournee_summary avec un join manuel
      const result = await supabase
        .from('tournee_summary')
        .select(`
          calendars_distributed,
          montant_total,
          user_id
        `);
      
      if (result.data && result.data.length > 0) {
        // Récupérer les profils des utilisateurs
        const userIds = result.data.map(stat => stat.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, team')
          .in('id', userIds);
        
        // Combiner les données
        stats = result.data.map(stat => ({
          ...stat,
          profiles: profiles?.find(p => p.id === stat.user_id) || { team: 'Sans équipe' }
        }));
        error = null;
      } else {
        stats = result.data;
        error = result.error;
      }
    } catch (viewError) {
      console.warn('Vue tournee_summary non disponible, utilisation du fallback:', viewError);
      // Fallback : utiliser directement les tables tournees et profiles
      const result = await supabase
        .from('tournees')
        .select(`
          calendriers_distribues,
          montant_collecte,
          profiles!inner(team)
        `)
        .not('calendriers_distribues', 'is', null)
        .not('montant_collecte', 'is', null);
      
      stats = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erreur lors de la récupération du résumé des équipes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    // Grouper par équipe
    const teamStats = new Map<string, { calendars: number; amount: number }>();

    stats?.forEach((stat: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const team = stat.profiles?.team || 'Sans équipe';
      const current = teamStats.get(team) || { calendars: 0, amount: 0 };
      
      // Gérer les deux cas : vue tournee_summary ou fallback direct
      const calendars = stat.calendars_distributed || stat.calendriers_distribues || 0;
      const amount = stat.montant_total || stat.montant_collecte || 0;
      
      teamStats.set(team, {
        calendars: current.calendars + calendars,
        amount: current.amount + amount
      });
    });

    // Convertir en array et trier par montant
    return Array.from(teamStats.entries())
      .map(([team, stats]) => ({
        team,
        totalCalendarsDistributed: stats.calendars,
        totalAmountCollected: stats.amount
      }))
      .sort((a, b) => b.totalAmountCollected - a.totalAmountCollected);
  } catch (error) {
    console.error('Erreur dans getTeamsSummary:', error);
    return [];
  }
}

/**
 * Récupère les statistiques globales de toutes les tournées
 */
export async function getGlobalStats(): Promise<{
  total_calendriers_distribues: number;
  total_montant_collecte: number;
  total_tournees_actives: number;
}> {
  const supabase = await createClient();

  try {
    // Requête directe sur support_transactions pour les vraies données
    const { data: transactions } = await supabase
      .from('support_transactions')
      .select('amount, calendar_accepted')
      .eq('payment_status', 'completed');

    const calendriers = transactions?.filter(t => t.calendar_accepted).length || 0;
    const montant = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Compter les tournées actives
    const { count: tournees_actives } = await supabase
      .from('tournees')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'active');

    return {
      total_calendriers_distribues: calendriers,
      total_montant_collecte: montant,
      total_tournees_actives: tournees_actives || 0
    };

  } catch (error) {
    console.warn('[getGlobalStats] Erreur:', error);
    return {
      total_calendriers_distribues: 0,
      total_montant_collecte: 0,
      total_tournees_actives: 0
    };
  }
}
