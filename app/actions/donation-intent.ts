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
  // Utiliser un client public/anon pour les pages publiques (pas de cookies)
  const { createClient: createPublicClient } = await import('@supabase/supabase-js')
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  )

  const { data: intent, error } = await supabase
    .from('donation_intents')
    .select(`
      *,
      tournees:tournee_id (
        zone,
        user_id,
        profiles:user_id ( full_name )
      )
    `)
    .eq('id', intentId)
    .single()

  if (error) {
    console.error('Erreur getDonationIntent (public):', error.message)
    return null
  }
  if (!intent) return null
  if (new Date(intent.expires_at) < new Date()) {
    // Mettre à jour le statut peut nécessiter un client authentifié; on n'échoue pas la page publique.
    return null
  }
  return intent
}
