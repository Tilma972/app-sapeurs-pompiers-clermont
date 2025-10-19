'use server'

import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'
import { buildSubject, buildHtml, buildText } from '@/lib/email/receipt-templates'
import { createAdminClient } from '@/lib/supabase/admin'

async function createSupabaseServerClient() {
  // Use admin client to bypass RLS for anonymous donor completion flow
  return createAdminClient()
}

const log = createLogger('actions/complete-donation')

export async function completeDonation(data: {
  token: string
  firstName: string
  lastName: string
  email: string
  addressLine1?: string
  postalCode: string
  city: string
}) {
  const supabase = await createSupabaseServerClient()

  try {
    // Fetch token and transaction
    const { data: tokenData } = await supabase
      .from('donor_completion_tokens')
      .select(`*, transaction:support_transactions(*)`)
      .eq('token', data.token)
      .single()

    if (!tokenData || tokenData.completed) {
      return { success: false, error: 'Token invalide ou déjà utilisé' }
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'Token expiré' }
    }

    const transaction = tokenData.transaction

    // Update transaction with donor info
    const fullName = `${data.firstName} ${data.lastName}`.trim()
    const { error: updateError } = await supabase
      .from('support_transactions')
      .update({
        supporter_name: fullName,
        supporter_email: data.email,
        supporter_address_line1: data.addressLine1 || null,
        supporter_postal_code: data.postalCode,
        supporter_city: data.city,
        payment_status: 'completed',
      })
      .eq('id', transaction.id)

    if (updateError) {
      log.error('Erreur mise à jour transaction', updateError)
      return { success: false, error: 'Erreur serveur' }
    }

    // Generate receipt number
    const { data: receiptNumber } = await supabase.rpc('generate_receipt_number')

    if (receiptNumber) {
      const currentYear = new Date().getFullYear()
      const sequenceNumber = parseInt(receiptNumber.split('-').pop() || '1')

      const { data: insertedReceipt } = await supabase
        .from('receipts')
        .insert({
          transaction_id: transaction.id,
          receipt_number: receiptNumber,
          fiscal_year: currentYear,
          sequence_number: sequenceNumber,
          receipt_type: 'fiscal',
          status: 'pending',
        })
        .select('public_access_token')
        .single()

      await supabase
        .from('support_transactions')
        .update({ receipt_number: receiptNumber })
        .eq('id', transaction.id)

      // Send email
      const params = {
        supporterName: fullName,
        amount: transaction.amount,
        receiptNumber: receiptNumber,
        publicAccessToken: insertedReceipt?.public_access_token ?? null,
        transactionType: 'fiscal' as const,
      }
      const subject = buildSubject(params)
      const html = buildHtml(params)
      const text = buildText(params)

      const result = await sendEmail({ to: data.email, subject, html, text })
      if (result.success) {
        await supabase
          .from('receipts')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_delivery_status: 'sent',
            status: 'sent',
          })
          .eq('transaction_id', transaction.id)
      }
    }

    // Mark token as completed
    await supabase
      .from('donor_completion_tokens')
      .update({ completed: true })
      .eq('id', tokenData.id)

    return { success: true }
  } catch (error) {
    log.error('Erreur completion don', { message: (error as Error)?.message })
    return { success: false, error: 'Erreur serveur' }
  }
}
