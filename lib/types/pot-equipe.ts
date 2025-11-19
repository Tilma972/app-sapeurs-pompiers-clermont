/**
 * Types et helpers pour le système de demandes de pot d'équipe
 *
 * NOTE TEMPORAIRE:
 * Ces types sont définis manuellement car la migration n'a pas encore été appliquée.
 * Après application de la migration 20251119_demandes_pot_equipe_system.sql,
 * régénérer les types avec: npx supabase gen types typescript
 */

// =====================================================
// TYPES TEMPORAIRES (à remplacer après migration)
// =====================================================

export type DemandePotEquipeRow = {
  id: string
  equipe_id: string
  demandeur_id: string
  titre: string
  description: string
  montant: number
  categorie: 'repas' | 'sortie' | 'equipement' | 'evenement' | 'autre'
  statut: 'en_attente' | 'en_cours' | 'validee' | 'payee' | 'rejetee'
  created_at: string
  updated_at: string
  validated_at: string | null
  validated_by: string | null
  paid_at: string | null
  paid_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
  notes_demandeur: string | null
  notes_tresorier: string | null
  preuve_paiement_url: string | null
}

export type MouvementPotEquipeRow = {
  id: string
  equipe_id: string
  type_mouvement: 'contribution' | 'depense' | 'ajustement'
  montant: number
  description: string
  demande_pot_id: string | null
  created_by: string | null
  created_at: string
  solde_apres: number | null
}

// =====================================================
// ENUMS
// =====================================================

export const CategorieDemandePot = {
  REPAS: 'repas',
  SORTIE: 'sortie',
  EQUIPEMENT: 'equipement',
  EVENEMENT: 'evenement',
  AUTRE: 'autre',
} as const

export type CategorieDemandePotType = typeof CategorieDemandePot[keyof typeof CategorieDemandePot]

export const StatutDemandePot = {
  EN_ATTENTE: 'en_attente',
  EN_COURS: 'en_cours',
  VALIDEE: 'validee',
  PAYEE: 'payee',
  REJETEE: 'rejetee',
} as const

export type StatutDemandePotType = typeof StatutDemandePot[keyof typeof StatutDemandePot]

export const TypeMouvementPot = {
  CONTRIBUTION: 'contribution',
  DEPENSE: 'depense',
  AJUSTEMENT: 'ajustement',
} as const

export type TypeMouvementPotType = typeof TypeMouvementPot[keyof typeof TypeMouvementPot]

// =====================================================
// TYPES ENRICHIS
// =====================================================

export type DemandePotEquipeAvecDetails = DemandePotEquipeRow & {
  demandeur?: {
    id: string
    full_name: string | null
    display_name: string | null
    email: string | null
  }
  equipe?: {
    id: string
    nom: string
    numero: number
  }
  validateur?: {
    id: string
    full_name: string | null
    display_name: string | null
  }
  payeur?: {
    id: string
    full_name: string | null
    display_name: string | null
  }
}

export type MouvementPotEquipeAvecDetails = MouvementPotEquipeRow & {
  auteur?: {
    id: string
    full_name: string | null
    display_name: string | null
  }
  demande?: {
    id: string
    titre: string
    montant: number
  }
}

// =====================================================
// TYPES DE FORMULAIRES ET INPUTS
// =====================================================

export type CreateDemandePotEquipeInput = {
  equipe_id: string
  titre: string
  description: string
  montant: number
  categorie: CategorieDemandePotType
  notes_demandeur?: string
}

export type ValiderDemandePotInput = {
  demande_id: string
  notes_tresorier?: string
}

export type MarquerPayeePotInput = {
  demande_id: string
  preuve_paiement_url?: string
}

export type RejeterDemandePotInput = {
  demande_id: string
  raison: string
}

export type AjouterMouvementPotInput = {
  equipe_id: string
  type_mouvement: TypeMouvementPotType
  montant: number
  description: string
}

// =====================================================
// HELPERS ET UTILITAIRES
// =====================================================

/**
 * Retourne le label français d'une catégorie
 */
export function getCategorieLabel(categorie: CategorieDemandePotType): string {
  const labels: Record<CategorieDemandePotType, string> = {
    repas: 'Repas',
    sortie: 'Sortie',
    equipement: 'Équipement',
    evenement: 'Événement',
    autre: 'Autre',
  }
  return labels[categorie] || categorie
}

/**
 * Retourne le label français d'un statut de demande
 */
export function getStatutPotLabel(statut: StatutDemandePotType): string {
  const labels: Record<StatutDemandePotType, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    validee: 'Validée',
    payee: 'Payée',
    rejetee: 'Rejetée',
  }
  return labels[statut] || statut
}

/**
 * Retourne la variante de badge pour un statut
 */
export function getStatutPotBadgeVariant(
  statut: StatutDemandePotType
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<StatutDemandePotType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    en_attente: 'secondary',
    en_cours: 'default',
    validee: 'outline',
    payee: 'default',
    rejetee: 'destructive',
  }
  return variants[statut] || 'default'
}

/**
 * Retourne le label français d'un type de mouvement
 */
export function getTypeMouvementLabel(type: TypeMouvementPotType): string {
  const labels: Record<TypeMouvementPotType, string> = {
    contribution: 'Contribution',
    depense: 'Dépense',
    ajustement: 'Ajustement',
  }
  return labels[type] || type
}

/**
 * Vérifie si une demande peut être validée
 */
export function canValidateDemandePot(demande: DemandePotEquipeRow): boolean {
  return demande.statut === StatutDemandePot.EN_ATTENTE
}

/**
 * Vérifie si une demande peut être marquée comme payée
 */
export function canMarkAsPaidPot(demande: DemandePotEquipeRow): boolean {
  const validStatuts: string[] = [
    StatutDemandePot.EN_ATTENTE,
    StatutDemandePot.EN_COURS,
    StatutDemandePot.VALIDEE,
  ]
  return validStatuts.includes(demande.statut)
}

/**
 * Vérifie si une demande peut être rejetée
 */
export function canRejectDemandePot(demande: DemandePotEquipeRow): boolean {
  const validStatuts: string[] = [
    StatutDemandePot.EN_ATTENTE,
    StatutDemandePot.EN_COURS,
    StatutDemandePot.VALIDEE,
  ]
  return validStatuts.includes(demande.statut)
}

/**
 * Formate le titre d'une demande pour l'affichage condensé
 */
export function formatTitreDemande(titre: string, maxLength: number = 50): string {
  if (titre.length <= maxLength) return titre
  return titre.substring(0, maxLength - 3) + '...'
}

/**
 * Retourne une couleur pour l'icône selon la catégorie
 */
export function getCategorieColor(categorie: CategorieDemandePotType): string {
  const colors: Record<CategorieDemandePotType, string> = {
    repas: 'text-orange-500',
    sortie: 'text-blue-500',
    equipement: 'text-purple-500',
    evenement: 'text-green-500',
    autre: 'text-gray-500',
  }
  return colors[categorie] || 'text-gray-500'
}

/**
 * Retourne l'emoji associé à une catégorie
 */
export function getCategorieEmoji(categorie: CategorieDemandePotType): string {
  const emojis: Record<CategorieDemandePotType, string> = {
    repas: '🍽️',
    sortie: '🎉',
    equipement: '🛠️',
    evenement: '🎊',
    autre: '📝',
  }
  return emojis[categorie] || '📝'
}
