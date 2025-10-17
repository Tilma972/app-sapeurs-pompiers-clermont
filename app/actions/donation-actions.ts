'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'
import { buildSubject, buildHtml, buildText } from '@/lib/email/receipt-templates'

export async function submitSupportTransaction(formData: FormData) {
  const log = createLogger('actions/donation')
  const supabase = await createSupabaseServerClient()
  
  // Récupération de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Extraction et validation sécurisée des données du formulaire
  const amountStr = formData.get('amount') as string
  if (!amountStr || typeof amountStr !== 'string' || amountStr.trim() === '' || isNaN(Number(amountStr))) {
    return { success: false, errors: ['Montant invalide'] }
  }
  const amount = Number(amountStr)
  if (amount <= 0 || amount > 10000) {
    return { success: false, errors: ['Le montant doit être entre 0,01€ et 10 000€'] }
  }

  const calendar_accepted = formData.get('calendar_accepted') === 'true'
  const supporter_name = formData.get('supporter_name') as string || undefined
  const supporter_email = formData.get('supporter_email') as string || undefined
  const supporter_phone = formData.get('supporter_phone') as string || undefined
  const payment_method = formData.get('payment_method') as Database['public']['Enums']['payment_method_enum']
  const notes = formData.get('notes') as string || undefined
  const tournee_id = formData.get('tournee_id') as string
  const consent_email = formData.get('consent_email') === 'true'

  // Validation des données essentielles (amount déjà validé ci-dessus)
  if (amount <= 0) {
    return { 
      success: false, 
      errors: ['Le montant doit être positif'] 
    }
  }

  if (!tournee_id) {
    return { 
      success: false, 
      errors: ['ID de tournée manquant'] 
    }
  }

  if (!payment_method || !['especes', 'cheque', 'carte', 'virement'].includes(payment_method)) {
    return { 
      success: false, 
      errors: ['Mode de paiement invalide'] 
    }
  }

  // Validation email pour les dons fiscaux
  if (!calendar_accepted && (!supporter_email || !supporter_email.trim())) {
    return { 
      success: false, 
      errors: ['Email obligatoire pour un don fiscal'] 
    }
  }

  // Validation format email si fourni - Regex RFC 5322 améliorée
  if (supporter_email && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(supporter_email.trim())) {
    return {
      success: false,
      errors: ['Format email invalide']
    }
  }

  // Vérification que la tournée appartient à l'utilisateur et est active
  const { data: tournee, error: tourneeError } = await supabase
    .from('tournees')
    .select('id, statut, user_id')
    .eq('id', tournee_id)
    .eq('user_id', user.id)
    .eq('statut', 'active')
    .single()

  if (tourneeError) {
    log.error('Erreur vérification tournée', tourneeError)
    return { 
      success: false, 
      errors: ['Erreur lors de la vérification de la tournée'] 
    }
  }

  if (!tournee) {
    return { 
      success: false, 
      errors: ['Tournée non trouvée, non active ou non autorisée'] 
    }
  }

  try {
    // Création de l'objet pour l'insertion (sans les colonnes générées automatiquement)
    const transactionToInsert: Database['public']['Tables']['support_transactions']['Insert'] = {
      user_id: user.id,
      tournee_id: tournee_id,
      amount: amount,
      calendar_accepted: calendar_accepted,
      // Les colonnes suivantes sont générées automatiquement par la BDD :
      // - transaction_type (basé sur calendar_accepted)
      // - tax_deductible (basé sur calendar_accepted)
      // - tax_reduction (basé sur amount et calendar_accepted)
      // - receipt_type (basé sur calendar_accepted)
      supporter_name: supporter_name || null,
      supporter_email: supporter_email || null,
      supporter_phone: supporter_phone || null,
      consent_email: consent_email,
      payment_method: payment_method,
      notes: notes || null,
      payment_status: 'completed', // Par défaut, paiement terminé
      receipt_generated: false,
      receipt_sent: false,
      created_offline: false
      // created_at et updated_at sont gérés automatiquement par la BDD
    }
    
    // Insertion de la transaction
    const { data: transaction, error: insertError } = await supabase
      .from('support_transactions')
      .insert(transactionToInsert)
      .select()
      .single()

    if (insertError) {
      log.error('Erreur insertion transaction', insertError)
      return { 
        success: false, 
        errors: ['Erreur lors de la sauvegarde du don. Veuillez réessayer.'] 
      }
    }

    // Génération du reçu si email fourni
    if (supporter_email) {
      await generateReceipt(transaction.id, supabase)

      // Essayer un envoi email (soft-fail)
      try {
        const params = {
          supporterName: supporter_name,
          amount,
          receiptNumber: transaction.receipt_number as string | null,
          transactionType: transaction.receipt_type as 'fiscal' | 'soutien',
        }
        const subject = buildSubject(params)
        const html = buildHtml(params)
        const text = buildText(params)
        const result = await sendEmail({ to: supporter_email, subject, html, text })
        if (result.success) {
          // Marquer le reçu comme envoyé
          const { error: updateErr } = await supabase
            .from('receipts')
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_delivery_status: 'sent',
              status: 'sent',
            })
            .eq('transaction_id', transaction.id)

          if (updateErr) {
            log.warn('MAJ statut reçu après envoi email a échoué', { transactionId: transaction.id })
          }
        } else if (!('skipped' in result)) {
          log.warn('Envoi email échoué (voir Resend)', { transactionId: transaction.id })
        }
      } catch (e) {
        log.warn('Exception envoi email ignorée', { message: (e as Error)?.message })
      }
    }

    // Revalidation des pages
    revalidatePath('/dashboard/ma-tournee')
    revalidatePath('/dashboard/calendriers')

    return { 
      success: true, 
      transaction,
      message: `Transaction ${transaction.transaction_type} de ${amount}€ enregistrée avec succès`
    }

  } catch (error) {
    const log = createLogger('actions/donation')
    log.error('Erreur serveur complète', { message: (error as Error)?.message })
    return { 
      success: false, 
      errors: ['Une erreur est survenue. Veuillez réessayer.'] 
    }
  }
}

async function generateReceipt(transactionId: string, supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  try {
    // Génération du numéro de reçu
    const { data: receiptNumber } = await supabase.rpc('generate_receipt_number')
    
    if (!receiptNumber) {
      const log = createLogger('actions/donation')
      log.warn('Impossible de générer le numéro de reçu')
      return
    }

    // Récupération des données de la transaction
    const { data: transaction } = await supabase
      .from('support_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      const log = createLogger('actions/donation')
      log.error('Transaction non trouvée pour génération reçu')
      return
    }

    // Création de l'entrée dans la table receipts
    const currentYear = new Date().getFullYear()
    const sequenceNumber = parseInt(receiptNumber.split('-').pop() || '1')

    const { error: receiptError } = await supabase
      .from('receipts')
      .insert({
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        fiscal_year: currentYear,
        sequence_number: sequenceNumber,
        receipt_type: transaction.receipt_type,
        status: 'pending'
      })

    if (receiptError) {
      const log = createLogger('actions/donation')
      log.error('Erreur création reçu', receiptError)
      return
    }

    // Mise à jour de la transaction avec le numéro de reçu
    await supabase
      .from('support_transactions')
      .update({ receipt_number: receiptNumber })
      .eq('id', transactionId)

    // TODO: Génération PDF asynchrone
    // TODO: Envoi email asynchrone

  } catch (error) {
    const log = createLogger('actions/donation')
    log.error('Erreur génération reçu', { message: (error as Error)?.message })
  }
}

export async function cloturerTournee(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const tourneeId = formData.get('tournee_id') as string
  const calendriersFinauxRaw = (formData.get('calendriers_finaux') as string) ?? ''
  const montantFinalRaw = (formData.get('montant_final') as string) ?? ''
  const parsedCalendriers = parseInt(calendriersFinauxRaw, 10)
  const parsedMontant = parseFloat(montantFinalRaw)
  const calendriersFinaux = Number.isFinite(parsedCalendriers) ? parsedCalendriers : 0
  const montantFinal = Number.isFinite(parsedMontant) ? parsedMontant : 0

  try {
    // Utilisation de la fonction SQL existante
    const { data, error } = await supabase.rpc('cloturer_tournee', {
      tournee_uuid: tourneeId,
      calendriers_finaux: calendriersFinaux,
      montant_final: montantFinal
    })

    if (error) {
      console.error('Erreur clôture tournée:', error)
      return { 
        success: false, 
        errors: ['Erreur lors de la clôture'] 
      }
    }

    if (!data) {
      return { 
        success: false, 
        errors: ['Tournée non trouvée ou non autorisée'] 
      }
    }

    // Revalidation des pages
    revalidatePath('/dashboard/ma-tournee')
    revalidatePath('/dashboard/calendriers')

    return { 
      success: true, 
      message: 'Tournée clôturée avec succès'
    }

  } catch (error) {
    console.error('Erreur serveur:', error)
    return { 
      success: false, 
      errors: ['Erreur serveur inattendue'] 
    }
  }
}

async function createSupabaseServerClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return await createClient()
}
