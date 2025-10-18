'use server'

import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
	const { createClient } = await import('@/lib/supabase/server')
	return await createClient()
}

const log = createLogger('actions/card-payments')

const USE_HELLOASSO_FALLBACK = process.env.USE_HELLOASSO_FOR_CARD === 'true'

export async function createCardPaymentIntent(params: {
	tourneeId: string
	amount: number
	calendarGiven?: boolean
}) {
	const supabase = await createSupabaseServerClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return { success: false, error: 'Non authentifié' }

	try {
		// Create donation intent
		const { data: intent, error: intentError } = await supabase
			.from('donation_intents')
			.insert({
				tournee_id: params.tourneeId,
				sapeur_pompier_id: user.id,
				expected_amount: params.amount,
				status: 'waiting_donor',
				expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
			})
			.select()
			.single()

		if (intentError || !intent) {
			log.error('Erreur création intention', intentError)
			return { success: false, error: 'Erreur création intention' }
		}

		// Decide provider: Stripe by default, HelloAsso if flagged or Stripe fails
		if (!USE_HELLOASSO_FALLBACK) {
			try {
				const { getStripe } = await import('@/lib/stripe/client')
				const stripe = getStripe()
				const pi = await stripe.paymentIntents.create({
					amount: Math.round(params.amount * 100),
					currency: 'eur',
					payment_method_types: ['card'],
					metadata: { intentId: intent.id, tourneeId: params.tourneeId },
				})

				await supabase
					.from('donation_intents')
					.update({ stripe_payment_intent_id: pi.id })
					.eq('id', intent.id)

				return {
					success: true,
					intentId: intent.id,
					clientSecret: pi.client_secret as string,
					provider: 'stripe' as const,
				}
			} catch (e) {
				log.warn('Stripe KO, fallback HelloAsso', { message: (e as Error)?.message })
			}
		}

		// Fallback HelloAsso (no API call here, just route to /don/[intentId])
		return {
			success: true,
			intentId: intent.id,
			donationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/don/${intent.id}`,
			expiresAt: intent.expires_at,
			provider: 'helloasso' as const,
		}
	} catch (error) {
		log.error('Erreur création paiement carte', { message: (error as Error)?.message })
		return { success: false, error: 'Erreur serveur' }
	}
}
