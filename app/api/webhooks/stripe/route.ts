import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLogger } from '@/lib/log'
import { sendEmail } from '@/lib/email/resend-client'
import { buildHtml, buildText } from '@/lib/email/receipt-templates'
import { buildBoutiqueSubject, buildBoutiqueHtml, buildBoutiqueText } from '@/lib/email/boutique-templates'
import { sendToN8n } from '@/lib/n8n/send-receipt'

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
      metadata?: { 
        tournee_id?: string
        calendar_given?: string
        user_id?: string
        source?: string
        items?: string  // JSON string des articles boutique
        customer_name?: string
      }
    }

    const admin = createAdminClient()
    const amount = (session.amount_total ?? 0) / 100
    const donorEmail = session.customer_details?.email ?? null
    const donorName = session.customer_details?.name ?? session.metadata?.customer_name ?? null

    // Parser les items de la boutique si présents
    type BoutiqueItem = { id: string; name: string; qty: number; price?: number }
    let boutiqueItems: BoutiqueItem[] = []
    if (session.metadata?.items) {
      try {
        boutiqueItems = JSON.parse(session.metadata.items) as BoutiqueItem[]
        log.info('📦 Items boutique parsés', { count: boutiqueItems.length, items: boutiqueItems })
      } catch (parseErr) {
        log.warn('⚠️ Impossible de parser metadata.items', { 
          raw: session.metadata.items, 
          error: (parseErr as Error).message 
        })
      }
    }

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

      // Préparer les données d'insertion
      const insertData: Record<string, unknown> = {
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
        source, // Nouvelle colonne
      }

      // Ajouter order_status pour les commandes boutique
      if (source === 'boutique') {
        insertData.order_status = 'pending'
      }

      const { data: tx } = await admin
        .from('support_transactions')
        .insert(insertData)
        .select('id, amount, supporter_name, supporter_email')
        .single()

      // =====================================================
      // INSERTION DES ARTICLES BOUTIQUE DANS ORDER_ITEMS
      // =====================================================
      if (tx && source === 'boutique' && boutiqueItems.length > 0) {
        try {
          // Récupérer les infos produits depuis la DB pour avoir les prix et images
          const productIds = boutiqueItems.map(item => item.id)
          const { data: products } = await admin
            .from('products')
            .select('id, name, price, image_url, description')
            .in('id', productIds)

          const productsMap = new Map(products?.map(p => [p.id, p]) || [])

          // Préparer les items à insérer
          const orderItemsToInsert = boutiqueItems.map(item => {
            const product = productsMap.get(item.id)
            return {
              transaction_id: tx.id,
              product_id: item.id,
              name: item.name || product?.name || 'Produit inconnu',
              description: product?.description || null,
              quantity: item.qty,
              unit_price: item.price || product?.price || 0,
              image_url: product?.image_url || null,
            }
          })

          const { error: itemsError } = await admin
            .from('order_items')
            .insert(orderItemsToInsert)

          if (itemsError) {
            log.error('❌ Échec insertion order_items', {
              transaction_id: tx.id,
              error: itemsError.message,
              items: orderItemsToInsert
            })
          } else {
            log.info('✅ Articles boutique enregistrés', {
              transaction_id: tx.id,
              items_count: orderItemsToInsert.length
            })
          }

          // Créer l'entrée initiale dans order_status_history
          await admin
            .from('order_status_history')
            .insert({
              transaction_id: tx.id,
              status: 'pending',
              notes: 'Commande créée via Stripe Checkout'
            })

        } catch (itemsErr) {
          log.error('❌ Exception insertion articles boutique', {
            transaction_id: tx.id,
            error: (itemsErr as Error).message
          })
        }
      }

      // ========================================================================
      // REÇU FISCAL - Code legacy désactivé
      // ========================================================================
      // Les reçus fiscaux PDF sont maintenant générés via appel direct à N8N
      // (voir sendToN8n ci-dessous). Le trigger PostgreSQL n'est plus utilisé.
      //
      // TODO: Supprimer le trigger support_transactions_n8n_webhook_trigger
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
          let confirmSubject: string
          let confirmHtml: string
          let confirmText: string

          if (source === 'boutique' && boutiqueItems.length > 0) {
            // =====================================================
            // EMAIL BOUTIQUE - Template style Shopify
            // =====================================================
            // Récupérer les prix depuis la DB pour les items
            const productIds = boutiqueItems.map(item => item.id)
            const { data: products } = await admin
              .from('products')
              .select('id, price, image_url')
              .in('id', productIds)

            const productsMap = new Map(products?.map(p => [p.id, p]) || [])

            const emailItems = boutiqueItems.map(item => {
              const product = productsMap.get(item.id)
              const unitPrice = item.price || product?.price || 0
              return {
                name: item.name,
                quantity: item.qty,
                unitPrice,
                totalPrice: unitPrice * item.qty,
                imageUrl: product?.image_url || undefined
              }
            })

            const emailParams = {
              customerName: tx.supporter_name as string | null,
              customerEmail: donorEmail,
              orderNumber: tx.id,
              items: emailItems,
              subtotal: amount,
              total: amount,
              orderDate: new Date()
            }

            confirmSubject = buildBoutiqueSubject(emailParams)
            confirmHtml = buildBoutiqueHtml(emailParams)
            confirmText = buildBoutiqueText(emailParams)

            log.info('📧 Email boutique préparé', {
              transaction_id: tx.id,
              items_count: emailItems.length
            })

          } else if (source === 'boutique') {
            // Boutique sans items parsés (fallback)
            confirmSubject = `Confirmation de votre commande - ${amount.toFixed(2)}€`
            confirmHtml = buildHtml({
              supporterName: tx.supporter_name as string | null,
              amount: tx.amount as number,
              receiptNumber: null,
              transactionType: 'soutien'
            })
            confirmText = buildText({
              supporterName: tx.supporter_name as string | null,
              amount: tx.amount as number,
              receiptNumber: null,
              transactionType: 'soutien'
            })

          } else {
            // Don classique (landing page ou terrain)
            const emailType = calendarAccepted ? 'soutien' : 'fiscal'
            confirmSubject = calendarAccepted
              ? `Merci pour votre soutien de ${amount.toFixed(2)}€`
              : `Merci pour votre don de ${amount.toFixed(2)}€`

            confirmHtml = buildHtml({
              supporterName: tx.supporter_name as string | null,
              amount: tx.amount as number,
              receiptNumber: null,
              transactionType: emailType
            })
            confirmText = buildText({
              supporterName: tx.supporter_name as string | null,
              amount: tx.amount as number,
              receiptNumber: null,
              transactionType: emailType
            })
          }

          await sendEmail({
            to: donorEmail,
            subject: confirmSubject,
            html: confirmHtml,
            text: confirmText
          })

          log.info('✅ Email de confirmation envoyé (Checkout)', {
            transaction_id: tx.id,
            email: donorEmail,
            amount,
            source
          })
        } catch (emailErr) {
          log.error('❌ Échec envoi email de confirmation (Checkout)', {
            transaction_id: tx.id,
            error: (emailErr as Error).message
          })
        }
      }

      // Appel direct au webhook n8n pour génération du reçu fiscal PDF
      // IMPORTANT: Pas de reçu fiscal pour la boutique (c'est une vente, pas un don)
      if (tx && amount >= 6 && donorEmail && source !== 'boutique') {
        try {
          log.info('🚀 Appel N8N direct pour génération reçu fiscal (Checkout)...', {
            transaction_id: tx.id,
            amount,
            calendar_accepted: calendarAccepted,
            source
          })

 

          await sendToN8n({

            transaction_id: tx.id,

            amount: tx.amount as number,

            calendar_accepted: calendarAccepted,

            donor_email: donorEmail,

            donor_name: tx.supporter_name as string | null,

            payment_method: 'carte',

            user_id: userId,

            tournee_id: tourneeId,

            created_at: new Date().toISOString()

          })

 

          log.info('✅ N8N déclenché avec succès (Checkout)', {

            transaction_id: tx.id

          })

        } catch (n8nErr) {

          log.error('❌ Échec appel N8N (Checkout)', {

            transaction_id: tx.id,

            error: (n8nErr as Error).message

          })

          // L'erreur est loggée mais on ne bloque pas le webhook Stripe

          // Stripe retentera automatiquement le webhook en cas d'échec

        }

      }

      // Log pour traçabilité
      if (source === 'landing_page_donation') {
        log.info('✅ Don landing page traité', { sessionId: session.id, amount, donorEmail })
      } else if (source === 'boutique') {
        log.info('✅ Commande boutique traitée (pas de reçu fiscal)', { sessionId: session.id, amount, donorEmail })
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
      // 2. REÇU FISCAL - Code legacy désactivé (PI)
      // ========================================================================
      // Les reçus fiscaux PDF sont générés via appel direct à N8N (voir ci-dessous)
      // TODO: Supprimer le trigger support_transactions_n8n_webhook_trigger
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

      // Appel direct au webhook n8n pour génération du reçu fiscal PDF

      if (amount >= 6 && tx.supporter_email) {

        try {

          log.info('🚀 Appel N8N direct pour génération reçu fiscal (PI)...', {

            transaction_id: tx.id,

            amount,

            calendar_accepted: calendarAccepted

          })

 

          await sendToN8n({

            transaction_id: tx.id,

            amount: tx.amount as number,

            calendar_accepted: calendarAccepted,

            donor_email: tx.supporter_email as string,

            donor_name: tx.supporter_name as string | null,

            payment_method: 'carte',

            user_id: meta.user_id ?? null,

            tournee_id: meta.tournee_id ?? null,

            created_at: new Date().toISOString()

          })

 

          log.info('✅ N8N déclenché avec succès (PI)', {

            transaction_id: tx.id

          })

        } catch (n8nErr) {

          log.error('❌ Échec appel N8N (PI)', {

            transaction_id: tx.id,

            error: (n8nErr as Error).message

          })

          // L'erreur est loggée mais on ne bloque pas le webhook Stripe

          // Stripe retentera automatiquement le webhook en cas d'échec

        }

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
      // 2. REÇU FISCAL - Code legacy désactivé (Charge)
      // ========================================================================
      // Les reçus fiscaux PDF sont générés via appel direct à N8N (voir ci-dessous)
      // TODO: Supprimer le trigger support_transactions_n8n_webhook_trigger
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

      // Appel direct au webhook n8n pour génération du reçu fiscal PDF

      if (amount >= 6 && donorEmail) {

        try {

          log.info('🚀 Appel N8N direct pour génération reçu fiscal (Charge)...', {

            transaction_id: tx.id,

            amount,

            calendar_accepted: calendarGiven

          })

 

          await sendToN8n({

            transaction_id: tx.id,

            amount,

            calendar_accepted: calendarGiven,

            donor_email: donorEmail,

            donor_name: donorName ?? null,

            payment_method: 'carte',

            user_id: userId,

            tournee_id: tourneeId,

            created_at: new Date().toISOString()

          })

 

          log.info('✅ N8N déclenché avec succès (Charge)', {

            transaction_id: tx.id

          })

        } catch (n8nErr) {

          log.error('❌ Échec appel N8N (Charge)', {

            transaction_id: tx.id,

            error: (n8nErr as Error).message

          })

          // L'erreur est loggée mais on ne bloque pas le webhook Stripe

          // Stripe retentera automatiquement le webhook en cas d'échec

        }

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
