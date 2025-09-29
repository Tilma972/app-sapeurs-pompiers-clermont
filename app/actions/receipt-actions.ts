'use server'

import { revalidatePath } from 'next/cache'
import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'
import { buildSubject, buildHtml, buildText } from '@/lib/email/receipt-templates'

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}

export async function resendReceiptAction(transactionId: string) {
  const log = createLogger('actions/receipt')
  const supabase = await createSupabaseServerClient()

  try {
    // Get current user to enforce RLS/ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, errors: ["Authentification requise"] }
    }

    // Load transaction joined with receipt (if any)
    const { data: tx, error: txErr } = await supabase
      .from('support_transactions')
      .select('id, user_id, tournee_id, amount, calendar_accepted, supporter_email, supporter_name, receipt_type, receipt_number')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (txErr || !tx) {
      log.warn('Transaction introuvable ou non autorisée', { transactionId })
      return { success: false, errors: ["Transaction introuvable"] }
    }

    if (!tx.supporter_email) {
      return { success: false, errors: ["Aucun email associé à cette transaction"] }
    }

    const params = {
      supporterName: tx.supporter_name as string | null,
      amount: tx.amount as number,
      receiptNumber: (tx.receipt_number as string | null) ?? null,
      transactionType: (tx.receipt_type as 'fiscal' | 'soutien') ?? (tx.calendar_accepted ? 'soutien' : 'fiscal'),
    }

    const subject = buildSubject(params)
    const html = buildHtml(params)
    const text = buildText(params)

    const result = await sendEmail({ to: tx.supporter_email, subject, html, text })

    if (!('skipped' in result) && result.success) {
      // Update receipt status
      const { error: recErr } = await supabase
        .from('receipts')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_delivery_status: 'sent',
          status: 'sent',
        })
        .eq('transaction_id', tx.id)

      if (recErr) {
        log.warn('MAJ reçu après renvoi email a échoué', { transactionId: tx.id })
      }

      // Revalidate views where this might show
      revalidatePath('/dashboard/ma-tournee')
      revalidatePath('/dashboard/calendriers')
      return { success: true, message: 'Reçu renvoyé avec succès' }
    }

    if ('skipped' in result) {
      return { success: false, skipped: true as const, errors: ["Envoi email désactivé (clé API manquante)"] }
    }

    log.warn('Renvoi email échoué (voir Resend)', { transactionId })
    return { success: false, errors: ["Échec d'envoi via Resend"] }
  } catch (e) {
    const err = e as Error
    log.error('Exception renvoi de reçu', { message: err.message })
    return { success: false, errors: ["Erreur serveur"] }
  }
}
