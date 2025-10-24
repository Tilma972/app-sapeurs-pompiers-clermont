"use server"

import { revalidatePath } from "next/cache"
import { createLogger } from "@/lib/log"

async function createSupabaseServerClient() {
  const { createClient } = await import("@/lib/supabase/server")
  return await createClient()
}

import { sendEmail } from "@/lib/email/resend-client"
import { buildSubject, buildHtml, buildText } from "@/lib/email/receipt-templates"

export type GenerateReceiptInput = {
  tourneeId: string
  amount: number
  paymentMethod: "especes" | "cheque"
  calendarGiven: boolean
  donorEmail: string
  donorFirstName?: string | null
  donorLastName?: string | null
  donorAddress?: string | null
  donorZip?: string | null
  donorCity?: string | null
}

export async function generateReceiptAction(input: GenerateReceiptInput) {
  const log = createLogger("actions/generate-receipt")

  // Basic validation
  if (!input || typeof input.amount !== "number" || input.amount <= 0) {
    return { success: false, errors: ["Montant invalide"] }
  }
  if (input.amount < 6) {
    return { success: false, errors: ["Montant minimum 6€"] }
  }
  if (!input.donorEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.donorEmail)) {
    return { success: false, errors: ["Email du donateur invalide"] }
  }
  if (input.paymentMethod !== "especes" && input.paymentMethod !== "cheque") {
    return { success: false, errors: ["Mode de paiement invalide"] }
  }

  const supabase = await createSupabaseServerClient()

  // Enforce auth and RLS ownership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, errors: ["Authentification requise"] }
  }

  try {
    // Insert transaction (compat: write both legacy and new donor fields)
    const { data: tx, error: txErr } = await supabase
      .from("support_transactions")
      .insert({
        user_id: user.id,
        tournee_id: input.tourneeId,
        amount: input.amount,
        calendar_accepted: !!input.calendarGiven,
        payment_method: input.paymentMethod,
        supporter_email: input.donorEmail,
        supporter_name: [input.donorFirstName, input.donorLastName].filter(Boolean).join(" ") || null,
        donor_first_name: input.donorFirstName ?? null,
        donor_last_name: input.donorLastName ?? null,
        donor_address: input.donorAddress ?? null,
        donor_zip: input.donorZip ?? null,
        donor_city: input.donorCity ?? null,
      })
      .select("id, amount, supporter_email, supporter_name")
      .single()

    if (txErr || !tx) {
      log.error("Insertion transaction échouée", { message: txErr?.message })
      return { success: false, errors: ["Échec de création de la transaction"] }
    }

    // Issue receipt via RPC (idempotent)
    const { data: issued, error: rpcErr } = await supabase
      .rpc("issue_receipt", { p_transaction_id: tx.id })
      .single()

    if (rpcErr || !issued) {
      log.error("Issue receipt RPC a échoué", { message: rpcErr?.message })
      return { success: false, errors: ["Échec de génération du reçu (RPC)"] }
    }

  type IssueReceiptRow = { id: string; receipt_number: string }
  const issuedRow = issued as IssueReceiptRow
  const receiptNumber: string | undefined = issuedRow?.receipt_number ?? undefined

    // Send email (no attachment yet; HTML includes download link if applicable)
    const subject = buildSubject({
      supporterName: tx.supporter_name as string | null,
      amount: tx.amount as number,
      receiptNumber: receiptNumber ?? null,
      transactionType: "fiscal",
    })
    const html = buildHtml({
      supporterName: tx.supporter_name as string | null,
      amount: tx.amount as number,
      receiptNumber: receiptNumber ?? null,
      transactionType: "fiscal",
    })
    const text = buildText({
      supporterName: tx.supporter_name as string | null,
      amount: tx.amount as number,
      receiptNumber: receiptNumber ?? null,
      transactionType: "fiscal",
    })

    const emailRes = await sendEmail({ to: tx.supporter_email as string, subject, html, text })

    if (!("skipped" in emailRes) && emailRes.success) {
      // Mark email status on receipts (best-effort)
      await supabase
        .from("receipts")
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_delivery_status: "sent",
          status: "sent",
        })
  .eq("transaction_id", issuedRow?.id)

      revalidatePath("/dashboard/ma-tournee")
      return { success: true, receiptNumber }
    }

    // Fallback: email failed or skipped
    if ("skipped" in emailRes) {
      return { success: true, warning: "email_disabled", receiptNumber }
    }

    return { success: true, warning: "email_failed", receiptNumber }
  } catch (e) {
    const err = e as Error
    log.error("Exception generateReceiptAction", { message: err.message })
    return { success: false, errors: ["Erreur serveur"] }
  }
}
