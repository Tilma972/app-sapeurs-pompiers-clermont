"use server"

import { revalidatePath } from "next/cache"
import { createLogger } from "@/lib/log"
// import { sendEmail } from "@/lib/email/resend-client" <-- PLUS BESOIN
// import { buildSubject, buildHtml, buildText } from "@/lib/email/receipt-templates" <-- PLUS BESOIN
import { sendToN8n } from "@/lib/n8n/send-receipt" // <-- IMPORT AJOUTÉ

async function createSupabaseServerClient() {
  const { createClient } = await import("@/lib/supabase/server")
  return await createClient()
}

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

  // Validation
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, errors: ["Authentification requise"] }
  }

  try {
    // 1. Insérer la transaction
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
        // Champs spécifiques manuel
        donor_first_name: input.donorFirstName ?? null,
        donor_last_name: input.donorLastName ?? null,
        donor_address: input.donorAddress ?? null,
        donor_zip: input.donorZip ?? null,
        donor_city: input.donorCity ?? null,
        notes: `Saisie manuelle (${input.paymentMethod})`
      })
      .select("id, amount, supporter_email, supporter_name")
      .single()

    if (txErr || !tx) {
      log.error("Insertion transaction échouée", { message: txErr?.message })
      return { success: false, errors: ["Échec de création de la transaction"] }
    }

    // 2. Générer le numéro de reçu (Optionnel : si vous voulez l'afficher tout de suite à l'écran)
    // Si N8N s'en charge, vous pouvez commenter ce bloc.
    // Mais le garder permet d'avoir un numéro tout de suite.
    const { data: issued, error: rpcErr } = await supabase
      .rpc("issue_receipt", { p_transaction_id: tx.id })
      .single()

    let receiptNumber: string | null = null
    
    if (!rpcErr && issued) {
       receiptNumber = (issued as { receipt_number?: string })?.receipt_number ?? null
    } else {
       log.warn("RPC issue_receipt échoué ou ignoré, N8N s'en chargera peut-être", { error: rpcErr?.message })
    }

    // 3. APPEL N8N DIRECT (Remplace l'envoi d'email local)
    try {
      log.info("🚀 Appel N8N pour reçu manuel...", { transaction_id: tx.id })
      
      await sendToN8n({
        transaction_id: tx.id,
        amount: tx.amount as number,
        calendar_accepted: !!input.calendarGiven,
        donor_email: input.donorEmail,
        donor_name: tx.supporter_name,
        donor_first_name: input.donorFirstName,
        donor_last_name: input.donorLastName,
        donor_address: input.donorAddress,
        donor_zip: input.donorZip,
        donor_city: input.donorCity,
        payment_method: input.paymentMethod,
        receipt_number: receiptNumber, // On passe le numéro si on l'a déjà généré
        source: 'manual_entry' // Important pour N8N
      })

      log.info("✅ N8N appelé avec succès")
      
      revalidatePath("/dashboard/ma-tournee")
      return { success: true, receiptNumber, message: "Reçu généré et envoyé par email via N8N" }

    } catch (n8nErr) {
      log.error("❌ Échec appel N8N (Manuel)", { error: (n8nErr as Error).message })
      return { 
        success: true, 
        warning: "email_failed", 
        receiptNumber, 
        message: "Transaction sauvée, mais échec envoi N8N. Vérifiez les logs." 
      }
    }

  } catch (e) {
    const err = e as Error
    log.error("Exception generateReceiptAction", { message: err.message })
    return { success: false, errors: ["Erreur serveur"] }
  }
}
