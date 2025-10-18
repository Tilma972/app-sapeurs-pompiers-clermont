'use server'

import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

const log = createLogger('actions/finalization-token')

export async function createFinalizationToken(params: { transactionId: string; email?: string }) {
  const supabase = await createSupabaseServerClient()

  try {
    // Validate transaction exists
    const { data: txn } = await supabase
      .from('support_transactions')
      .select('id, amount, supporter_email, payment_status')
      .eq('id', params.transactionId)
      .single()

    if (!txn) {
      return { success: false, error: 'Transaction introuvable' }
    }

    // Create token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const { error: insertError } = await supabase
      .from('donor_completion_tokens')
      .insert({ transaction_id: params.transactionId, token, expires_at: expiresAt.toISOString() })

    if (insertError) {
      log.error('Erreur création token', insertError)
      return { success: false, error: "Impossible de créer le lien" }
    }

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/finaliser-don/${token}`

    // Optionally email the link
    if (params.email) {
      const subject = `Finalisez votre don de ${txn.amount}€ pour recevoir votre reçu fiscal`
      const html = `
        <p>Bonjour,</p>
        <p>Merci pour votre don de <strong>${txn.amount}€</strong>.</p>
        <p>Pour recevoir votre reçu fiscal, merci de compléter vos informations en cliquant sur le bouton ci-dessous&nbsp;:</p>
        <p><a href="${url}">Finaliser mon don</a></p>
        <p>Ce lien est valable 48 heures.</p>
      `
      const text = `Merci pour votre don de ${txn.amount}€\nFinalisez vos informations ici: ${url}\nLien valable 48h.`
      await sendEmail({ to: params.email, subject, html, text })
      return { success: true, url, emailed: true }
    }

    return { success: true, url }
  } catch (error) {
    log.error('Erreur finalization token', { message: (error as Error)?.message })
    return { success: false, error: 'Erreur serveur' }
  }
}
