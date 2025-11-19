import { Database } from '@/lib/database.types'

// =====================================================
// TYPES DE BASE DE DONNÉES
// =====================================================

export type DemandeVersementRow = Database['public']['Tables']['demandes_versement']['Row']
export type DemandeVersementInsert = Database['public']['Tables']['demandes_versement']['Insert']
export type DemandeVersementUpdate = Database['public']['Tables']['demandes_versement']['Update']

// Alias pour compatibilité
export type DemandeVersement = DemandeVersementRow

// =====================================================
// ENUMS
// =====================================================

/**
 * Types de versement disponibles
 */
export const TypeVersement = {
  VIREMENT: 'virement',
  CARTE_CADEAU: 'carte_cadeau',
} as const

export type TypeVersementType = typeof TypeVersement[keyof typeof TypeVersement]

/**
 * Statuts d'une demande de versement
 */
export const StatutDemande = {
  EN_ATTENTE: 'en_attente',    // Créée par l'utilisateur
  EN_COURS: 'en_cours',        // Validée par trésorier, paiement en cours
  VALIDEE: 'validee',          // Obsolète (remplacé par EN_COURS)
  PAYEE: 'payee',              // Paiement effectué
  REJETEE: 'rejetee',          // Refusée par trésorier
} as const

export type StatutDemandeType = typeof StatutDemande[keyof typeof StatutDemande]

// =====================================================
// TYPES POUR L'AFFICHAGE
// =====================================================

/**
 * Demande de versement avec informations utilisateur
 * Utilisé dans les listes et tableaux
 */
export type DemandeVersementAvecUtilisateur = DemandeVersement & {
  user?: {
    id: string
    full_name?: string | null
    display_name?: string | null
    email?: string | null
  } | null
  equipe?: {
    id: string
    nom: string
    numero?: number | null
  } | null
}

/**
 * Demande de versement détaillée
 * Avec toutes les relations et métadonnées
 */
export type DemandeVersementDetaillee = DemandeVersement & {
  user?: {
    id: string
    full_name?: string | null
    display_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  equipe?: {
    id: string
    nom: string
    numero?: number | null
  } | null
  validated_by_user?: {
    id: string
    full_name?: string | null
  } | null
  paid_by_user?: {
    id: string
    full_name?: string | null
  } | null
  rejected_by_user?: {
    id: string
    full_name?: string | null
  } | null
}

/**
 * Statistiques des demandes pour le dashboard trésorier
 */
export type StatistiquesDemandes = {
  total_demandes: number
  en_attente: number
  en_cours: number
  payees: number
  rejetees: number
  montant_total_en_attente: number
  montant_total_paye: number
}

// =====================================================
// TYPES POUR LES FORMULAIRES
// =====================================================

/**
 * Données pour créer une nouvelle demande de versement
 */
export type CreateDemandeVersementInput = {
  montant: number
  type_versement: TypeVersementType
  iban?: string
  nom_beneficiaire?: string
  notes_utilisateur?: string
}

/**
 * Données pour valider une demande (trésorier)
 */
export type ValiderDemandeInput = {
  demande_id: string
  notes_tresorier?: string
}

/**
 * Données pour marquer une demande comme payée (trésorier)
 */
export type MarquerPayeeInput = {
  demande_id: string
  preuve_paiement_url?: string
}

/**
 * Données pour rejeter une demande (trésorier)
 */
export type RejeterDemandeInput = {
  demande_id: string
  raison: string
}

// =====================================================
// TYPES POUR LES FILTRES
// =====================================================

/**
 * Filtres pour la liste des demandes
 */
export type DemandeVersementFilters = {
  statut?: StatutDemandeType | StatutDemandeType[]
  type_versement?: TypeVersementType
  equipe_id?: string
  user_id?: string
  date_debut?: string
  date_fin?: string
  montant_min?: number
  montant_max?: number
}

/**
 * Options de tri pour les demandes
 */
export type DemandeVersementSortOptions = {
  field: 'created_at' | 'montant' | 'statut' | 'updated_at'
  direction: 'asc' | 'desc'
}

// =====================================================
// HELPERS DE VALIDATION
// =====================================================

/**
 * Vérifie si une demande peut être modifiée par l'utilisateur
 */
export function canUserEditDemande(demande: DemandeVersement): boolean {
  return demande.statut === StatutDemande.EN_ATTENTE
}

/**
 * Vérifie si une demande peut être validée
 */
export function canValidateDemande(demande: DemandeVersement): boolean {
  return demande.statut === StatutDemande.EN_ATTENTE
}

/**
 * Vérifie si une demande peut être marquée comme payée
 */
export function canMarkAsPaid(demande: DemandeVersement): boolean {
  return demande.statut === StatutDemande.EN_COURS || demande.statut === StatutDemande.VALIDEE
}

/**
 * Vérifie si une demande peut être rejetée
 */
export function canRejectDemande(demande: DemandeVersement): boolean {
  return demande.statut !== StatutDemande.PAYEE && demande.statut !== StatutDemande.REJETEE
}

/**
 * Récupère le label d'un statut
 */
export function getStatutLabel(statut: StatutDemandeType): string {
  const labels: Record<StatutDemandeType, string> = {
    [StatutDemande.EN_ATTENTE]: 'En attente',
    [StatutDemande.EN_COURS]: 'En cours',
    [StatutDemande.VALIDEE]: 'Validée',
    [StatutDemande.PAYEE]: 'Payée',
    [StatutDemande.REJETEE]: 'Rejetée',
  }
  return labels[statut] || statut
}

/**
 * Récupère le label d'un type de versement
 */
export function getTypeVersementLabel(type: TypeVersementType): string {
  const labels: Record<TypeVersementType, string> = {
    [TypeVersement.VIREMENT]: 'Virement bancaire',
    [TypeVersement.CARTE_CADEAU]: 'Carte cadeau',
  }
  return labels[type] || type
}

/**
 * Masque un IBAN pour l'affichage (garde les 4 premiers et 2 derniers caractères)
 */
export function masquerIBAN(iban: string | null | undefined): string {
  if (!iban) return '—'

  // Nettoyer l'IBAN (enlever espaces)
  const cleanIban = iban.replace(/\s/g, '')

  if (cleanIban.length < 8) return '****'

  const debut = cleanIban.substring(0, 4)
  const fin = cleanIban.substring(cleanIban.length - 2)
  const milieu = '*'.repeat(cleanIban.length - 6)

  return `${debut} ${milieu} ${fin}`
}

/**
 * Récupère la variante de couleur pour un badge de statut
 */
export function getStatutBadgeVariant(statut: StatutDemandeType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case StatutDemande.EN_ATTENTE:
      return 'secondary'
    case StatutDemande.EN_COURS:
    case StatutDemande.VALIDEE:
      return 'default'
    case StatutDemande.PAYEE:
      return 'outline'
    case StatutDemande.REJETEE:
      return 'destructive'
    default:
      return 'default'
  }
}
