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
 * Pot d'équipe calculé depuis les tournées complétées
 * Indépendant des clôtures individuelles
 */
export type PotEquipeTournees = {
  total_collecte: number
  part_equipe: number
  annee_campagne: number
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

/**
 * Solde antérieur d'une équipe pour une année donnée
 * Saisi manuellement par le trésorier
 */
export type PotEquipeHistorique = {
  id: string
  equipe_id: string
  annee: number
  solde_anterieur: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Résumé du pot d'équipe pour l'interface trésorier
 * Combine le pot calculé depuis les tournées et le solde antérieur saisi
 */
export type EquipePotSummary = {
  equipe_id: string
  equipe_nom: string
  part_equipe_campagne: number   // Calculé depuis les tournées complétées
  annee_campagne: number
  solde_anterieur: number        // Depuis pots_equipe_historique
  total_disponible: number       // = part_equipe_campagne + solde_anterieur
  historique_id: string | null   // null si pas encore saisi
}
