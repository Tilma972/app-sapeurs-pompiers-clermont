import { Database } from '@/lib/database.types'

// Types de base de données
export type EquipeRow = Database['public']['Tables']['equipes']['Row']
export type EquipeInsert = Database['public']['Tables']['equipes']['Insert']
export type EquipeUpdate = Database['public']['Tables']['equipes']['Update']

// Alias pour compatibilité
export type Equipe = EquipeRow

/**
 * Paramètres de répartition d'une équipe
 * Utilisé pour les requêtes partielles
 */
export type EquipeSettings = {
  pourcentage_minimum_pot?: number
  pourcentage_recommande_pot?: number
}

/**
 * Informations complètes d'une équipe
 * Utilisé pour les paramètres d'équipe (chef/admin)
 */
export type EquipeDetails = {
  id: string
  nom: string
  enable_retribution: boolean
  pourcentage_minimum_pot: number
  pourcentage_recommande_pot: number
  mode_transparence: 'prive' | 'equipe' | 'anonyme'
}

/**
 * Informations d'équipe avec paramètres
 * Retour typique d'une jointure profiles -> equipes
 */
export type EquipeWithSettings = EquipeSettings & {
  id?: string
  nom?: string
  mode_transparence?: string
}

/**
 * Profile avec team_id
 * Extension pour les requêtes qui joignent l'équipe
 */
export type ProfileWithTeam = {
  team_id?: string | null
  role?: string
}
