'use server'

import { createLogger } from '@/lib/log'
import type { DonationIntent } from '@/lib/types/donation-intent'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function createDonationIntent(data: { tourneeId: string; expectedAmount?: number }) {
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
  // DB now allows NULL for open intents
  expected_amount: data.expectedAmount ?? null,
  donor_name_hint: null,
  donor_email: null,
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

type JoinedTournee = {
  zone?: string | null
  user_id?: string | null
  profiles?: { full_name?: string | null } | null
}

export async function getDonationIntent(intentId: string): Promise<(DonationIntent & { tournees?: JoinedTournee }) | null> {
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
  return intent as DonationIntent & { tournees?: JoinedTournee }
}

