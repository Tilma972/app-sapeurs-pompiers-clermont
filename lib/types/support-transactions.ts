import { Database } from '@/lib/database.types'

// Types basés sur la BDD mais adaptés à l'usage applicatif
export type PaymentMethod = Database['public']['Enums']['payment_method_enum']
export type TransactionType = 'don_fiscal' | 'soutien'
export type ReceiptType = 'fiscal' | 'soutien'

// Types de base de données
export type SupportTransactionRow = Database['public']['Tables']['support_transactions']['Row']
export type SupportTransactionInsert = Database['public']['Tables']['support_transactions']['Insert']
export type SupportTransactionUpdate = Database['public']['Tables']['support_transactions']['Update']

export type ReceiptRow = Database['public']['Tables']['receipts']['Row']
export type ReceiptInsert = Database['public']['Tables']['receipts']['Insert']
export type ReceiptUpdate = Database['public']['Tables']['receipts']['Update']

export type TourneeSummaryRow = Database['public']['Views']['tournee_summary']['Row']

export interface SupportTransactionInput {
  amount: number
  calendar_accepted: boolean // CHAMP CLÉ
  supporter_name?: string
  supporter_email?: string
  supporter_phone?: string
  payment_method: PaymentMethod
  notes?: string
  tournee_id: string
  consent_email?: boolean
}

export interface SupportTransactionWithCalculations extends SupportTransactionInput {
  transaction_type: TransactionType
  tax_deductible: boolean
  tax_reduction: number
  receipt_type: ReceiptType
}

// Alias pour les types de base de données
export type SupportTransaction = SupportTransactionRow
export type Receipt = ReceiptRow
export type TourneeSummary = TourneeSummaryRow

// Helper functions
export function calculateTransactionFields(input: SupportTransactionInput): SupportTransactionWithCalculations {
  return {
    ...input,
    transaction_type: input.calendar_accepted ? 'soutien' : 'don_fiscal',
    tax_deductible: !input.calendar_accepted,
    tax_reduction: input.calendar_accepted ? 0 : Math.round(input.amount * 0.66 * 100) / 100,
    receipt_type: input.calendar_accepted ? 'soutien' : 'fiscal'
  }
}

export function validateSupportTransaction(input: SupportTransactionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (input.amount <= 0) errors.push('Le montant doit être positif')
  if (!input.calendar_accepted && !input.supporter_email?.trim()) {
    errors.push('Email obligatoire pour un don fiscal')
  }
  if (input.supporter_email && !/\S+@\S+\.\S+/.test(input.supporter_email)) {
    errors.push('Format email invalide')
  }
  if (input.amount > 10000) {
    errors.push('Montant maximum autorisé : 10 000€')
  }
  
  return { valid: errors.length === 0, errors }
}

export function getTransactionTypeLabel(type: TransactionType): string {
  return type === 'don_fiscal' ? 'Don fiscal' : 'Soutien'
}

export function getTransactionTypeDescription(type: TransactionType, amount: number): string {
  if (type === 'don_fiscal') {
    const reduction = Math.round(amount * 0.66 * 100) / 100
    return `Don fiscal de ${amount}€ - Déduction d'impôt : ${reduction}€`
  } else {
    return `Soutien de ${amount}€ avec calendrier offert`
  }
}

export function getReceiptTypeLabel(type: ReceiptType): string {
  return type === 'fiscal' ? 'Reçu fiscal' : 'Reçu de soutien'
}
