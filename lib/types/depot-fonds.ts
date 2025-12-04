/**
 * Types pour le système de dépôt de fonds physiques
 * Les utilisateurs demandent un RDV pour déposer leurs fonds collectés au trésorier
 */

export type StatutDemandeDepot = 'en_attente' | 'valide' | 'ecart' | 'annule'

export interface DemandeDepotFonds {
  id: string
  user_id: string
  montant_a_deposer: number
  montant_recu: number | null
  statut: StatutDemandeDepot
  disponibilites_proposees: string | null
  date_depot_prevue: string | null
  valide_par: string | null
  valide_le: string | null
  notes_utilisateur: string | null
  notes_tresorier: string | null
  created_at: string
  updated_at: string
}

export interface DemandeDepotFondsAvecProfile extends DemandeDepotFonds {
  profiles: {
    full_name: string | null
    team: string | null
  } | null
  validateur?: {
    full_name: string | null
  } | null
}

export interface CreerDemandeDepotInput {
  montant_a_deposer: number
  disponibilites_proposees?: string
  notes_utilisateur?: string
}

export interface ValiderDemandeDepotInput {
  demande_id: string
  montant_recu: number
  notes_tresorier?: string
}

export interface AnnulerDemandeDepotInput {
  demande_id: string
}

export interface EnregistrerDepotDirectInput {
  user_id: string
  montant_recu: number
  notes_tresorier?: string
}

/**
 * Helper pour formater le statut en français
 */
export function formatStatutDepot(statut: StatutDemandeDepot): string {
  const labels: Record<StatutDemandeDepot, string> = {
    en_attente: 'En attente',
    valide: 'Validé',
    ecart: 'Écart détecté',
    annule: 'Annulé',
  }
  return labels[statut] || statut
}

/**
 * Helper pour déterminer la couleur du badge de statut
 */
export function getStatutDepotColor(statut: StatutDemandeDepot): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'en_attente':
      return 'outline'
    case 'valide':
      return 'default'
    case 'ecart':
      return 'secondary'
    case 'annule':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * Helper pour calculer l'écart entre montant déclaré et reçu
 */
export function calculerEcartDepot(montant_declare: number, montant_recu: number | null): number | null {
  if (montant_recu === null) return null
  return montant_recu - montant_declare
}

/**
 * Helper pour formater l'écart avec signe
 */
export function formatEcartDepot(ecart: number | null): string {
  if (ecart === null) return '-'
  if (Math.abs(ecart) < 0.01) return 'Aucun'
  return ecart > 0 ? `+${ecart.toFixed(2)}€` : `${ecart.toFixed(2)}€`
}
