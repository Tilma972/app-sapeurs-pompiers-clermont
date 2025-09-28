'use server'

import { helloAssoClient } from '@/lib/helloasso/client'
import { createLogger } from '@/lib/log'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function createHelloAssoCheckout(data: {
  intentId: string
  amount: number
  donor: { firstName: string; lastName: string; email: string }
  fiscalReceipt: boolean
}) {
  const log = createLogger('actions/helloasso-checkout')
  const supabase = await createSupabaseServerClient()

  try {
    const { data: intent, error: intentError } = await supabase
      .from('donation_intents')
      .select('*')
      .eq('id', data.intentId)
      .eq('status', 'waiting_donor')
      .single()

    if (intentError || !intent) {
      log.error('Intention de don introuvable', { intentId: data.intentId })
      return { success: false, error: 'Intention de don introuvable' }
    }

    if (new Date(intent.expires_at) < new Date()) {
      await supabase.from('donation_intents').update({ status: 'expired' }).eq('id', data.intentId)
      return { success: false, error: 'Intention de don expirée' }
    }

    const checkoutIntent = await helloAssoClient.createCheckoutIntent({
      totalAmount: Math.round(data.amount * 100),
      itemName: `Don Sapeurs-Pompiers Clermont-l'Hérault`,
      backUrl: `${process.env.HELLOASSO_CANCEL_URL}?intent=${data.intentId}`,
      errorUrl: `${process.env.HELLOASSO_CANCEL_URL}?intent=${data.intentId}`,
      returnUrl: `${process.env.HELLOASSO_SUCCESS_URL}?intent=${data.intentId}`,
      containsDonation: true,
      metadata: {
        intentId: data.intentId,
        tourneeId: intent.tournee_id,
        fiscalReceipt: String(data.fiscalReceipt),
      },
      payer: {
        firstName: data.donor.firstName,
        lastName: data.donor.lastName,
        email: data.donor.email,
      },
    })

    await supabase
      .from('donation_intents')
      .update({
        final_amount: data.amount,
        donor_first_name: data.donor.firstName,
        donor_last_name: data.donor.lastName,
        donor_email: data.donor.email,
        fiscal_receipt: data.fiscalReceipt,
        helloasso_checkout_intent_id: checkoutIntent.id,
      })
      .eq('id', data.intentId)

    return { success: true, checkoutUrl: checkoutIntent.url }
  } catch (error) {
    log.error('Erreur création checkout HelloAsso', { message: (error as Error)?.message })
    return { success: false, error: 'Erreur lors de la création du paiement' }
  }
}
