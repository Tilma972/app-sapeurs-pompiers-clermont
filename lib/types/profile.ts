import { Database } from '@/lib/database.types'

// Types de base de données
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Alias pour compatibilité
export type Profile = ProfileRow & {
  // OPTIMISATION: Type étendu pour supporter le JOIN avec equipes
  equipe?: {
    id: string
    nom: string
    secteur: string | null
    calendriers_alloues: number | null
  } | null
}

// Extension temporaire pour accéder à team_id même si les types générés ne l'incluent pas encore
export type ProfileWithTeamId = Profile & { team_id?: string | null }

