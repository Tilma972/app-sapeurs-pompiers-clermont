import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'
import { buildHtml, buildText } from '@/lib/email/receipt-templates'
// Note: buildSubject commenté car génération de reçu fiscal désactivée (voir lignes 110-134, 370-414, 592-636)

const log = createLogger('webhook/stripe')

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: unknown

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    log.error('Signature Stripe invalide', { message: (err as Error)?.message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Log webhook
  await admin.from('webhook_logs').insert({
    source: 'stripe',
    payload: event as Record<string, unknown>,
    headers: { signature },
    status: 'received',
    event_type: (event as { type?: string }).type,
  })

  const e = event as { type: string; data: { object: unknown } }
  // New flow: Stripe Checkout
  if (e.type === 'checkout.session.completed') {
    const session = e.data.object as {
      id: string
      amount_total?: number | null
      customer_details?: { email?: string | null; name?: string | null } | null
      metadata?: { tournee_id?: string; calendar_given?: string; user_id?: string; source?: string }
    }

    const admin = createAdminClient()
    const amount = (session.amount_total ?? 0) / 100
    const donorEmail = session.customer_details?.email ?? null
    const donorName = session.customer_details?.name ?? null

    // Idempotence by stripe_session_id
    const { data: existing } = await admin
      .from('support_transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    if (!existing) {
      const calendarAccepted = (session.metadata?.calendar_given === 'true') ? true : false
      const userId = session.metadata?.user_id ?? null
      const tourneeId = session.metadata?.tournee_id ?? null
      const source = session.metadata?.source ?? 'boutique'

      // Déterminer les notes en fonction de la source
      let notes = 'Stripe Checkout'
      if (source === 'landing_page_donation') {
        notes = 'Don landing page (Stripe Checkout)'
      } else if (source === 'boutique') {
        notes = 'Boutique (Stripe Checkout)'
      }

      const { data: tx } = await admin
        .from('support_transactions')
        .insert({
          user_id: userId,
          tournee_id: tourneeId,
          amount,
          calendar_accepted: calendarAccepted,
          payment_method: 'carte',
          payment_status: 'completed',
          stripe_session_id: session.id,
          supporter_email: donorEmail,
          supporter_name: donorName,
          notes,
        })
        .select('id, amount, supporter_name, supporter_email')
        .single()

      // ========================================================================
      // REÇU FISCAL - DÉSACTIVÉ (géré par trigger n8n → Gotenberg → PDF)
      // ========================================================================
      // Les reçus fiscaux PDF sont maintenant générés automatiquement par :
      //   1. Trigger PostgreSQL détecte INSERT dans support_transactions
      //   2. Envoie webhook à n8n via pg_net
      //   3. n8n génère PDF via Gotenberg
      //   4. n8n envoie email avec PDF en pièce jointe
      //
      // ROLLBACK : Si n8n est HS pendant >24h, décommenter le code ci-dessous
      //            et redéployer l'application
      // ========================================================================
      /*
      if (tx && amount >= 6 && !calendarAccepted) {
        const { data: rec } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()
        const receiptNumber = (rec as { receipt_number?: string } | null)?.receipt_number ?? null

        const receiptUrl = receiptNumber
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/recu/${receiptNumber}`
          : null
        await admin
          .from('support_transactions')
          .update({ receipt_generated: new Date().toISOString(), receipt_url: receiptUrl })
          .eq('id', tx.id)

        if (donorEmail) {
          const subject = buildSubject({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
          const html = buildHtml({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
          const text = buildText({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
          await sendEmail({ to: donorEmail, subject, html, text })
          await admin
            .from('support_transactions')
            .update({ receipt_sent: true })
            .eq('id', tx.id)
        }
      }
      */

      // Email de confirmation immédiat (tous les montants)
      if (tx && donorEmail) {
        try {
          const confirmSubject = calendarAccepted
            ? `Merci pour votre soutien de ${amount.toFixed(2)}€`
            : `Merci pour votre don de ${amount.toFixed(2)}€`

          const confirmHtml = buildHtml({
            supporterName: tx.supporter_name as string | null,
            amount: tx.amount as number,
            receiptNumber: null,
            transactionType: calendarAccepted ? 'soutien' : 'fiscal'
          })

          const confirmText = buildText({
            supporterName: tx.supporter_name as string | null,
            amount: tx.amount as number,
            receiptNumber: null,
            transactionType: calendarAccepted ? 'soutien' : 'fiscal'
          })

          await sendEmail({
            to: donorEmail,
            subject: confirmSubject,
            html: confirmHtml,
            text: confirmText
          })

          log.info('✅ Email de confirmation envoyé (Checkout)', {
            transaction_id: tx.id,
            email: donorEmail,
            amount
          })
        } catch (emailErr) {
          log.error('❌ Échec envoi email de confirmation (Checkout)', {
            transaction_id: tx.id,
            error: (emailErr as Error).message
          })
        }
      }

      // Log pour traçabilité du trigger n8n
      if (tx && amount >= 6) {
        log.info('📄 Reçu fiscal sera généré par n8n trigger', {
          transaction_id: tx.id,
          amount,
          calendar_accepted: calendarAccepted,
          trigger: 'support_transactions_n8n_webhook_trigger'
        })
      }

      // Log pour traçabilité
      if (source === 'landing_page_donation') {
        log.info('✅ Don landing page traité', { sessionId: session.id, amount, donorEmail })
      }
    }
  }
  if (e.type === 'payment_intent.succeeded') {
    const paymentIntent = e.data.object as {
      id: string
      amount: number
      payment_method?: string
      metadata?: { [k: string]: string | undefined }
      latest_charge?: string | null
      charges?: {
        data?: Array<{
          billing_details?: { name?: string | null; email?: string | null }
        }>
      }
    }

    const meta = (paymentIntent.metadata || {}) as {
      tournee_id?: string
      calendar_given?: string
      user_id?: string
      donor_name?: string
      donor_email?: string
    }

    const amount = paymentIntent.amount / 100
    const calendarAccepted = meta.calendar_given === 'true'

    // Idempotency: reuse stripe_session_id field to store PI id as well
    const { data: existing } = await admin
      .from('support_transactions')
      .select('id')
      .eq('stripe_session_id', paymentIntent.id)
      .maybeSingle()

    if (existing) {
      log.info('Transaction déjà enregistrée (PI)', { payment_intent_id: paymentIntent.id })
      return NextResponse.json({ received: true })
    }

    // Resolve name/email
    let billingName: string | undefined
    let billingEmail: string | undefined
    const donorName: string | undefined = meta.donor_name || undefined
    const donorEmail: string | undefined = meta.donor_email || undefined

    const charge = paymentIntent.charges?.data?.[0]
    const chargeDetails = charge?.billing_details as { name?: string | null; email?: string | null } | undefined
    if (chargeDetails) {
      billingName = chargeDetails.name ?? undefined
      billingEmail = chargeDetails.email ?? undefined
    }

    if (!billingName && !billingEmail) {
      try {
        const stripe = getStripe()
        if (paymentIntent.payment_method) {
          const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          const details = (pm as { billing_details?: { name?: string | null; email?: string | null } })?.billing_details
          billingName = details?.name ?? undefined
          billingEmail = details?.email ?? undefined
        }
      } catch (err) {
        log.warn('Impossible de récupérer les billing_details via PaymentMethod', { message: (err as Error)?.message })
      }
    }

    if ((!billingName && !billingEmail) && paymentIntent.latest_charge) {
      try {
        const stripe = getStripe()
        const ch = await stripe.charges.retrieve(paymentIntent.latest_charge)
        const bd = (ch as { billing_details?: { name?: string | null; email?: string | null } }).billing_details
        billingName = bd?.name ?? billingName
        billingEmail = bd?.email ?? billingEmail
      } catch (err) {
        log.warn('Impossible de récupérer latest_charge', { message: (err as Error)?.message })
      }
    }

    const effectiveName = donorName ?? billingName
    const effectiveEmail = donorEmail ?? billingEmail

    try {
      const { data: tx, error: insertError } = await admin
        .from('support_transactions')
        .insert({
          user_id: meta.user_id ?? null,
          tournee_id: meta.tournee_id ?? null,
          amount,
          calendar_accepted: calendarAccepted,
          payment_method: 'carte',
          payment_status: 'completed',
          notes: `Stripe PI - ${paymentIntent.id}`,
          supporter_name: effectiveName,
          supporter_email: effectiveEmail,
          stripe_session_id: paymentIntent.id,
        })
        .select('id, amount, supporter_name, supporter_email')
        .single()

      if (insertError) {
        log.error('❌ Échec insertion support_transactions (PI)', {
          payment_intent_id: paymentIntent.id,
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          metadata: meta,
          amount,
          effectiveName,
          effectiveEmail
        })
        return NextResponse.json(
          { error: 'Database insertion failed', details: insertError.message },
          { status: 500 }
        )
      }

      if (!tx) {
        log.error('❌ Transaction non créée (PI)', { payment_intent_id: paymentIntent.id })
        return NextResponse.json(
          { error: 'Transaction creation failed' },
          { status: 500 }
        )
      }

      log.info('✅ Transaction créée (PI)', {
        transaction_id: tx.id,
        payment_intent_id: paymentIntent.id,
        amount,
        supporter_name: effectiveName
      })

      // 1. Email de confirmation TOUJOURS envoyé (pour tous les montants)
      if (tx.supporter_email) {
        try {
          const confirmSubject = calendarAccepted
            ? `Confirmation de votre soutien de ${amount.toFixed(2)}€`
            : `Confirmation de votre don de ${amount.toFixed(2)}€`
          const confirmHtml = buildHtml({
            supporterName: tx.supporter_name as string | null,
            amount: tx.amount as number,
            receiptNumber: null,
            transactionType: calendarAccepted ? 'soutien' : 'fiscal'
          })
          const confirmText = buildText({
            supporterName: tx.supporter_name as string | null,
            amount: tx.amount as number,
            receiptNumber: null,
            transactionType: calendarAccepted ? 'soutien' : 'fiscal'
          })

          await sendEmail({
            to: tx.supporter_email as string,
            subject: confirmSubject,
            html: confirmHtml,
            text: confirmText
          })

          log.info('✅ Email de confirmation envoyé (PI)', {
            transaction_id: tx.id,
            email: tx.supporter_email
          })
        } catch (emailErr) {
          log.error('❌ Échec envoi email de confirmation (PI)', {
            transaction_id: tx.id,
            error: (emailErr as Error).message
          })
          // Continue execution - email confirmation n'est pas critique
        }
      }

      // ========================================================================
      // 2. REÇU FISCAL - DÉSACTIVÉ (géré par trigger n8n → Gotenberg → PDF)
      // ========================================================================
      // Les reçus fiscaux PDF sont maintenant générés automatiquement par le
      // trigger PostgreSQL support_transactions_n8n_webhook_trigger
      //
      // ROLLBACK : Si n8n est HS, décommenter le code ci-dessous et redéployer
      // ========================================================================
      /*
      if (amount >= 6 && !calendarAccepted) {
        try {
          const { data: rec, error: receiptError } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()

          if (receiptError) {
            log.error('❌ Échec génération reçu fiscal (PI)', {
              transaction_id: tx.id,
              error: receiptError.message
            })
          } else {
            const receiptNumber = (rec as { receipt_number?: string } | null)?.receipt_number ?? null

            const receiptUrl = receiptNumber
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/recu/${receiptNumber}`
              : null
            await admin
              .from('support_transactions')
              .update({ receipt_generated: new Date().toISOString(), receipt_url: receiptUrl })
              .eq('id', tx.id)

            if (tx.supporter_email && receiptNumber) {
              const subject = buildSubject({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
              const html = buildHtml({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
              const text = buildText({ supporterName: tx.supporter_name as string | null, amount: tx.amount as number, receiptNumber: receiptNumber, transactionType: 'fiscal' })
              await sendEmail({ to: tx.supporter_email as string, subject, html, text })
              await admin
                .from('support_transactions')
                .update({ receipt_sent: true })
                .eq('id', tx.id)

              log.info('✅ Reçu fiscal envoyé (PI)', {
                transaction_id: tx.id,
                receipt_number: receiptNumber
              })
            }
          }
        } catch (receiptErr) {
          log.error('❌ Exception génération/envoi reçu fiscal (PI)', {
            transaction_id: tx.id,
            error: (receiptErr as Error).message
          })
        }
      }
      */

      // Log pour traçabilité du trigger n8n
      if (amount >= 6 && tx.supporter_email) {
        log.info('📄 Reçu fiscal sera généré par n8n trigger (PI)', {
          transaction_id: tx.id,
          amount,
          calendar_accepted: calendarAccepted,
          trigger: 'support_transactions_n8n_webhook_trigger'
        })
      }

      log.info('✅ Don Stripe (PI) traité', { payment_intent_id: paymentIntent.id, amount, transaction_id: tx.id })
    } catch (err) {
      log.error('❌ Exception webhook payment_intent.succeeded', {
        payment_intent_id: paymentIntent.id,
        error: (err as Error).message,
        stack: (err as Error).stack
      })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Traiter charge.succeeded pour bénéficier de billing_details complets; PI reste en fallback
  if (e.type === 'charge.succeeded') {
    const charge = e.data.object as {
      id: string
      amount: number
      billing_details?: { name?: string | null; email?: string | null }
      payment_intent?: string | null
      metadata?: Record<string, string>
    }

    const metadata = charge.metadata || {}
    let tourneeId = metadata.tournee_id
    let userId = metadata.user_id
    let calendarGiven = metadata.calendar_given === 'true'

    // Si metadata manquantes sur la charge, tenter de lire celles du PaymentIntent
    if ((!tourneeId || !userId) && charge.payment_intent) {
      try {
        const stripe = getStripe()
        const pi = await stripe.paymentIntents.retrieve(charge.payment_intent)
        const piMeta = (pi as { metadata?: Record<string, string> }).metadata || {}
        tourneeId = tourneeId || piMeta.tournee_id
        userId = userId || piMeta.user_id
        if (typeof piMeta.calendar_given === 'string') {
          calendarGiven = piMeta.calendar_given === 'true'
        }
      } catch (err) {
        log.warn('Impossible de récupérer metadata depuis PI', { message: (err as Error)?.message, chargeId: charge.id })
      }
    }

    if (!tourneeId || !userId) {
      log.warn('Metadata manquantes sur charge', { chargeId: charge.id })
      return NextResponse.json({ received: true })
    }

    // Idempotence par PI id (ou charge.id si PI absent)
    const piId = charge.payment_intent || charge.id
    const { data: existing } = await admin
      .from('support_transactions')
      .select('id')
      .eq('stripe_session_id', piId)
      .maybeSingle()

    if (existing) {
      log.info('Transaction déjà traitée', { piId })
      return NextResponse.json({ received: true })
    }

    const donorName = charge.billing_details?.name || undefined
    const donorEmail = charge.billing_details?.email || undefined
    const amount = charge.amount / 100

    try {
      const { data: tx, error: insertError } = await admin
        .from('support_transactions')
        .insert({
          user_id: userId,
          tournee_id: tourneeId,
          amount,
          calendar_accepted: calendarGiven,
          payment_method: 'carte',
          payment_status: 'completed',
          stripe_session_id: piId,
          supporter_name: donorName,
          supporter_email: donorEmail,
          notes: `Stripe Charge - ${charge.id}`,
        })
        .select('id, amount, supporter_name, supporter_email')
        .single()

      if (insertError) {
        log.error('❌ Échec insertion support_transactions (Charge)', {
          charge_id: charge.id,
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          tourneeId,
          userId,
          amount,
          donorName,
          donorEmail
        })
        return NextResponse.json(
          { error: 'Database insertion failed', details: insertError.message },
          { status: 500 }
        )
      }

      if (!tx) {
        log.error('❌ Transaction non créée (Charge)', { charge_id: charge.id })
        return NextResponse.json(
          { error: 'Transaction creation failed' },
          { status: 500 }
        )
      }

      log.info('✅ Transaction créée (Charge)', {
        transaction_id: tx.id,
        charge_id: charge.id,
        amount,
        supporter_name: donorName
      })

      // 1. Email de confirmation TOUJOURS envoyé (pour tous les montants)
      if (donorEmail) {
        try {
          const confirmSubject = calendarGiven
            ? `Confirmation de votre soutien de ${amount.toFixed(2)}€`
            : `Confirmation de votre don de ${amount.toFixed(2)}€`
          const confirmHtml = buildHtml({
            supporterName: donorName ?? null,
            amount,
            receiptNumber: null,
            transactionType: calendarGiven ? 'soutien' : 'fiscal'
          })
          const confirmText = buildText({
            supporterName: donorName ?? null,
            amount,
            receiptNumber: null,
            transactionType: calendarGiven ? 'soutien' : 'fiscal'
          })

          await sendEmail({
            to: donorEmail,
            subject: confirmSubject,
            html: confirmHtml,
            text: confirmText
          })

          log.info('✅ Email de confirmation envoyé (Charge)', {
            transaction_id: tx.id,
            email: donorEmail
          })
        } catch (emailErr) {
          log.error('❌ Échec envoi email de confirmation (Charge)', {
            transaction_id: tx.id,
            error: (emailErr as Error).message
          })
          // Continue execution - email confirmation n'est pas critique
        }
      }

      // ========================================================================
      // 2. REÇU FISCAL - DÉSACTIVÉ (géré par trigger n8n → Gotenberg → PDF)
      // ========================================================================
      // Les reçus fiscaux PDF sont maintenant générés automatiquement par le
      // trigger PostgreSQL support_transactions_n8n_webhook_trigger
      //
      // ROLLBACK : Si n8n est HS, décommenter le code ci-dessous et redéployer
      // ========================================================================
      /*
      if (amount >= 6 && !calendarGiven) {
        try {
          const { data: rec, error: receiptError } = await admin.rpc('issue_receipt', { p_transaction_id: tx.id }).single()

          if (receiptError) {
            log.error('❌ Échec génération reçu fiscal (Charge)', {
              transaction_id: tx.id,
              error: receiptError.message
            })
          } else {
            const receiptNumber = (rec as { receipt_number?: string } | null)?.receipt_number ?? null

            const receiptUrl = receiptNumber
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/recu/${receiptNumber}`
              : null
            await admin
              .from('support_transactions')
              .update({ receipt_generated: new Date().toISOString(), receipt_url: receiptUrl })
              .eq('id', tx.id)

            if (donorEmail && receiptNumber) {
              const subject = buildSubject({ supporterName: donorName ?? null, amount, receiptNumber, transactionType: 'fiscal' })
              const html = buildHtml({ supporterName: donorName ?? null, amount, receiptNumber, transactionType: 'fiscal' })
              const text = buildText({ supporterName: donorName ?? null, amount, receiptNumber, transactionType: 'fiscal' })
              await sendEmail({ to: donorEmail, subject, html, text })
              await admin
                .from('support_transactions')
                .update({ receipt_sent: true })
                .eq('id', tx.id)

              log.info('✅ Reçu fiscal envoyé (Charge)', {
                transaction_id: tx.id,
                receipt_number: receiptNumber
              })
            }
          }
        } catch (receiptErr) {
          log.error('❌ Exception génération/envoi reçu fiscal (Charge)', {
            transaction_id: tx.id,
            error: (receiptErr as Error).message
          })
        }
      }
      */

      // Log pour traçabilité du trigger n8n
      if (amount >= 6 && donorEmail) {
        log.info('📄 Reçu fiscal sera généré par n8n trigger (Charge)', {
          transaction_id: tx.id,
          amount,
          calendar_accepted: calendarGiven,
          trigger: 'support_transactions_n8n_webhook_trigger'
        })
      }

      log.info('✅ Don traité (charge.succeeded)', { chargeId: charge.id, amount, transaction_id: tx.id })
      return NextResponse.json({ received: true })
    } catch (err) {
      log.error('❌ Exception webhook charge.succeeded', {
        charge_id: charge.id,
        error: (err as Error).message,
        stack: (err as Error).stack
      })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
