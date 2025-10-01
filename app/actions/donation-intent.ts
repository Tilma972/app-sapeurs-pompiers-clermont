'use server'

import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function createDonationIntent(data: { tourneeId: string; expectedAmount?: number; donorNameHint?: string }) {
  const log = createLogger('actions/donation-intent')
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .select('id, statut, user_id')
    .eq('id', data.tourneeId)
    .eq('user_id', user.id)
    .eq('statut', 'active')
    .single()

  if (tourneeError || !tournee) {
    log.error('Tournée non trouvée ou non autorisée', { tourneeId: data.tourneeId })
    return { success: false, error: 'Tournée non trouvée' }
  }

  try {
    const { data: intent, error: insertError } = await supabase
      .from('donation_intents')
      .insert({
        tournee_id: data.tourneeId,
        sapeur_pompier_id: user.id,
        expected_amount: data.expectedAmount ?? null,
        donor_name_hint: data.donorNameHint || null,
        status: 'waiting_donor',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (insertError || !intent) {
      log.error('Erreur création intention de don', insertError)
      return { success: false, error: 'Erreur lors de la création' }
    }

    const donationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/don/${intent.id}`
    return { success: true, intentId: intent.id, donationUrl, expiresAt: intent.expires_at }
  } catch (error) {
    log.error('Erreur serveur', { message: (error as Error)?.message })
    return { success: false, error: 'Erreur serveur' }
  }
}

export async function getDonationIntent(intentId: string) {
  console.log('🔵 [getDonationIntent] START - intentId:', intentId)

  const { createClient: createPublicClient } = await import('@supabase/supabase-js')
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  )

  // Query 1: Récupérer l'intent avec tournee info basique
  const { data: intent, error } = await supabase
    .from('donation_intents')
    .select('*, tournees(zone, user_id)')
    .eq('id', intentId)
    .single()

  console.log('🔵 [getDonationIntent] Intent query:', { hasData: !!intent, hasError: !!error })

  if (error || !intent) {
    console.error('❌ [getDonationIntent] Error:', error)
    return null
  }

  // Query 2: Récupérer le nom du pompier séparément
  if (intent.tournees?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', intent.tournees.user_id)
      .single()
    
    if (profile) {
      intent.tournees.profiles = profile
    }
  }

  const isExpired = intent.expires_at ? new Date(intent.expires_at) < new Date() : false

  console.log('✅ [getDonationIntent] Success:', { status: intent.status, isExpired })
  return intent
}

export type FinalizeDonationResult = { success: true; checkoutUrl: string } | { success: false; error?: string }

export async function finalizeDonationIntent(params: {
  intentId: string
  amount: number
  donor?: { firstName?: string; lastName?: string; email?: string }
  fiscalReceipt?: boolean
}): Promise<FinalizeDonationResult> {
  const log = createLogger('actions/finalize-donation-intent')
  const supabase = await createSupabaseServerClient()

  const { intentId, amount, donor, fiscalReceipt } = params
  if (!intentId || !amount || amount <= 0) {
  return { success: false, error: 'Paramètres invalides' }
  }

  // 1) Vérifier l'intention
  const { data: intent, error: intentError } = await supabase
    .from('donation_intents')
    .select('*')
    .eq('id', intentId)
    .single()

  if (intentError || !intent) {
    log.error('Intention introuvable', { intentId, intentError })
  return { success: false, error: 'Intention introuvable' }
  }

  if (intent.status !== 'waiting_donor' && intent.status !== 'completed') {
  return { success: false, error: 'Statut invalide pour finalisation' }
  }

  // 2) Mettre à jour l'intention avec le montant et les infos donateur
  const { error: updateError } = await supabase
    .from('donation_intents')
    .update({
      expected_amount: amount,
      final_amount: amount,
      donor_first_name: donor?.firstName || intent.donor_first_name || null,
      donor_last_name: donor?.lastName || intent.donor_last_name || null,
      donor_email: donor?.email || intent.donor_email || null,
      fiscal_receipt: fiscalReceipt ?? intent.fiscal_receipt ?? false,
    })
    .eq('id', intentId)

  if (updateError) {
    log.error('Erreur update intention', updateError)
  return { success: false, error: 'Erreur lors de la mise à jour' }
  }

  // 3) Créer le checkout HelloAsso
  const { createHelloAssoCheckout } = await import('@/app/actions/helloasso-checkout')
  const result = await createHelloAssoCheckout({
    intentId,
    amount,
    donor: {
      firstName: donor?.firstName || intent.donor_first_name || '',
      lastName: donor?.lastName || intent.donor_last_name || '',
      email: donor?.email || intent.donor_email || '',
    },
    fiscalReceipt: fiscalReceipt ?? intent.fiscal_receipt ?? false,
  })

  if (!result.success || !result.checkoutUrl) {
    return { success: false, error: result.error || 'Erreur HelloAsso' }
  }

  return { success: true, checkoutUrl: result.checkoutUrl }
}