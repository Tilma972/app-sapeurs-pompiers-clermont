'use server'

import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function createDonationIntent(data: { tourneeId: string; expectedAmount: number; donorNameHint?: string }) {
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
        expected_amount: data.expectedAmount,
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

  // Utiliser un client public/anon pour les pages publiques (pas de cookies)
  const { createClient: createPublicClient } = await import('@supabase/supabase-js')
  console.log('🔵 [getDonationIntent] Creating public Supabase client')
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  )

  const { data: intent, error } = await supabase
    .from('donation_intents')
    .select(`
      *,
      tournees!tournee_id (
        zone,
        user_id,
        profiles!user_id (
          full_name
        )
      )
    `)
    .eq('id', intentId)
    .single()

  console.log('🔵 [getDonationIntent] Query result:', {
    hasData: Boolean(intent),
    hasError: Boolean(error),
    errorMessage: error?.message,
    intentStatus: intent?.status,
    expiresAt: intent?.expires_at,
  })

  if (error) {
    console.error('❌ [getDonationIntent] Supabase error:', error)
    return null
  }

  if (!intent) {
    console.warn('⚠️ [getDonationIntent] No intent found')
    return null
  }

  const isExpired = intent.expires_at ? new Date(intent.expires_at) < new Date() : false
  console.log('🔵 [getDonationIntent] Expiration check:', {
    expiresAt: intent.expires_at,
    now: new Date().toISOString(),
    isExpired,
  })

  // Note: On ne met PAS à jour le statut ici (client public). La page gère l'UX "expiré".
  if (isExpired && intent.status !== 'expired') {
    console.log('⏱️ [getDonationIntent] Intent expired (status differs), leaving as-is for public view')
  }

  console.log('✅ [getDonationIntent] Returning intent')
  return intent
}
