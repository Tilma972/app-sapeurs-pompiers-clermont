import { Database } from '@/lib/database.types'

// Types de base de données
export type TourneeRow = Database['public']['Tables']['tournees']['Row']
export type TourneeInsert = Database['public']['Tables']['tournees']['Insert']
export type TourneeUpdate = Database['public']['Tables']['tournees']['Update']

export type TransactionRow = Database['public']['Tables']['support_transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['support_transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['support_transactions']['Update']

// Alias pour compatibilité
export type Tournee = TourneeRow
export type Transaction = TransactionRow

// Types pour les opérations CRUD
export type TourneeCreate = Omit<TourneeInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type TransactionCreate = Omit<TransactionInsert, 'id' | 'created_at' | 'updated_at'>

export interface TourneeStats {
  calendriers_distribues: number;
  montant_collecte: number;
  nombre_transactions: number;
}

export interface TourneeDetailedStats {
  tournee_id: string;
  zone: string;
  statut: string;
  date_debut: string;
  date_fin?: string;
  calendriers_alloues: number;
  calendriers_distribues: number;
  montant_collecte: number;
  nombre_transactions: number;
  montant_especes: number;
  montant_cheques: number;
  montant_cartes: number;
}

export interface UserTourneeStats {
  total_tournees: number;
  tournees_actives: number;
  tournees_completed: number;
  total_calendriers_distribues: number;
  total_montant_collecte: number;
  moyenne_calendriers_par_tournee: number;
  moyenne_montant_par_tournee: number;
}
