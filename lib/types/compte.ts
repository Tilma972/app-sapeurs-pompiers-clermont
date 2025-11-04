import { Database } from '@/lib/database.types'

// Types de base de données
export type CompteRow = Database['public']['Tables']['comptes_sp']['Row']
export type CompteInsert = Database['public']['Tables']['comptes_sp']['Insert']
export type CompteUpdate = Database['public']['Tables']['comptes_sp']['Update']

// Alias pour compatibilité
export type Compte = CompteRow

/**
 * Soldes et préférences d'un compte utilisateur
 * Utilisé pour l'affichage dans Mon Compte
 */
export type CompteSolde = {
  solde_disponible?: number | null
  total_retributions?: number | null
  pourcentage_pot_equipe_defaut?: number | null
}

/**
 * Pot d'équipe avec solde
 */
export type PotEquipe = {
  solde_disponible: number
}

/**
 * Mouvement de rétribution
 * Historique des transactions
 */
export type MouvementRetribution = {
  created_at: string
  montant_total_collecte: number | null
  montant_compte_perso: number | null
}
