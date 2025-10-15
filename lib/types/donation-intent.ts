export interface DonationIntent {
  id: string
  tournee_id: string
  sapeur_pompier_id: string
  expected_amount: number | null
  final_amount: number | null
  status: 'waiting_donor' | 'completed' | 'expired' | string
  donor_first_name?: string | null
  donor_last_name?: string | null
  donor_email?: string | null
  donor_name_hint?: string | null
  expires_at?: string | null
  support_transaction_id?: string | null
  // Add any joined fields if needed in a separate type to avoid tight coupling
}

export function hasExpectedAmount(intent: DonationIntent): boolean {
  return intent.expected_amount != null && intent.expected_amount > 0
}

export function getOpenIntents(intents: DonationIntent[]): DonationIntent[] {
  return intents.filter(i => i.expected_amount == null)
}

export function getFixedIntents(intents: DonationIntent[]): DonationIntent[] {
  return intents.filter(i => i.expected_amount != null)
}
