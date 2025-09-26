import { createClient } from "@/lib/supabase/server";
import { 
  Transaction, 
  TransactionCreate, 
  TransactionUpdate
} from "@/lib/types/tournee";

/**
 * Crée une nouvelle transaction
 */
export async function createTransaction(transactionData: TransactionCreate): Promise<Transaction | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Vérifier que la tournée appartient à l'utilisateur
  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .select('id')
    .eq('id', transactionData.tournee_id)
    .eq('user_id', user.id)
    .single();

  if (tourneeError || !tournee) {
    console.error('Tournée non trouvée ou non autorisée:', tourneeError);
    return null;
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    return null;
  }

  return transaction;
}

/**
 * Récupère une transaction par son ID
 */
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select(`
      *,
      tournees!inner(user_id)
    `)
    .eq('id', transactionId)
    .eq('tournees.user_id', user.id)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    return null;
  }

  return transaction;
}

/**
 * Récupère toutes les transactions d'une tournée
 */
export async function getTourneeTransactions(tourneeId: string): Promise<Transaction[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      tournees!inner(user_id)
    `)
    .eq('tournee_id', tourneeId)
    .eq('tournees.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return [];
  }

  return transactions || [];
}

/**
 * Récupère les dernières transactions de l'utilisateur
 */
export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      tournees!inner(user_id, zone)
    `)
    .eq('tournees.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des transactions récentes:', error);
    return [];
  }

  return transactions || [];
}

/**
 * Met à jour une transaction
 */
export async function updateTransaction(transactionId: string, updates: TransactionUpdate): Promise<Transaction | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Vérifier que la transaction appartient à l'utilisateur
  const { data: existingTransaction, error: checkError } = await supabase
    .from('transactions')
    .select(`
      id,
      tournees!inner(user_id)
    `)
    .eq('id', transactionId)
    .eq('tournees.user_id', user.id)
    .single();

  if (checkError || !existingTransaction) {
    console.error('Transaction non trouvée ou non autorisée:', checkError);
    return null;
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de la transaction:', error);
    return null;
  }

  return transaction;
}

/**
 * Supprime une transaction
 */
export async function deleteTransaction(transactionId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Vérifier que la transaction appartient à l'utilisateur
  const { data: existingTransaction, error: checkError } = await supabase
    .from('transactions')
    .select(`
      id,
      tournees!inner(user_id)
    `)
    .eq('id', transactionId)
    .eq('tournees.user_id', user.id)
    .single();

  if (checkError || !existingTransaction) {
    console.error('Transaction non trouvée ou non autorisée:', checkError);
    return false;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) {
    console.error('Erreur lors de la suppression de la transaction:', error);
    return false;
  }

  return true;
}

/**
 * Récupère les statistiques des transactions d'une tournée
 */
export async function getTourneeTransactionStats(tourneeId: string): Promise<{
  total_transactions: number;
  total_montant: number;
  total_calendars: number;
  montant_especes: number;
  montant_cheques: number;
  montant_cartes: number;
} | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      montant,
      calendars_given,
      payment_method,
      tournees!inner(user_id)
    `)
    .eq('tournee_id', tourneeId)
    .eq('tournees.user_id', user.id);

  if (error) {
    console.error('Erreur lors de la récupération des statistiques des transactions:', error);
    return null;
  }

  const stats = {
    total_transactions: data.length,
    total_montant: data.reduce((sum, t) => sum + parseFloat(t.montant), 0),
    total_calendars: data.reduce((sum, t) => sum + t.calendars_given, 0),
    montant_especes: data
      .filter(t => t.payment_method === 'espèces')
      .reduce((sum, t) => sum + parseFloat(t.montant), 0),
    montant_cheques: data
      .filter(t => t.payment_method === 'chèque')
      .reduce((sum, t) => sum + parseFloat(t.montant), 0),
    montant_cartes: data
      .filter(t => t.payment_method === 'carte')
      .reduce((sum, t) => sum + parseFloat(t.montant), 0)
  };

  return stats;
}


