import { Database } from '@/lib/database.types'

// Types de base de données
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Alias pour compatibilité
export type Profile = ProfileRow
