'use server'

/**
 * Server Actions pour la gestion des dépenses du pot d'équipe
 * - Chef d'équipe : soumettre une demande
 * - Trésorier : approuver, marquer payée, rejeter
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isTreasurerRole, canManageTeam } from '@/lib/config'
import { getSoldeDisponiblePot } from '@/lib/supabase/pot-depenses'
import { getPotEquipeTournees, getSoldeAnterieur } from '@/lib/supabase/compte'
import { sendEmail } from '@/lib/email/resend-client'
import type { SupabaseClient } from '@supabase/supabase-js'

// =====================================================
// TYPES
// =====================================================

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

// =====================================================
// HELPERS INTERNES
// =====================================================

async function getTresorierEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['tresorier', 'admin'])
    .not('email', 'is', null)
    .limit(1)
    .single()
  return data?.email ?? null
}

// =====================================================
// ACTION CHEF : SOUMETTRE UNE DEMANDE
// =====================================================

/**
 * Soumet une demande de dépense sur le pot d'équipe
 * Réservé au chef d'équipe (role = 'chef')
 * Le justificatif doit déjà avoir été uploadé côté client
 */
export async function soumettreDemandeAction(input: {
  equipeId: string
  motif: string
  prestataireNom: string
  montantDemande: number
  justificatifUrl: string
  justificatifEstProvisoire?: boolean
  totalDisponible: number
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Non authentifié' }

    // Rôle chef
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, team_id, full_name, display_name, email')
      .eq('id', user.id)
      .single()

    if (!profile || !canManageTeam(profile.role)) {
      return { success: false, error: 'Réservé au chef d\'équipe' }
    }

    if (profile.role !== 'chef') {
      return { success: false, error: 'Réservé au chef d\'équipe' }
    }

    if (profile.team_id !== input.equipeId) {
      return { success: false, error: 'Vous ne pouvez soumettre que pour votre propre équipe' }
    }

    // Validation montant
    if (input.montantDemande <= 0) {
      return { success: false, error: 'Le montant doit être supérieur à 0' }
    }

    // Vérifier solde disponible
    const soldeDisponible = await getSoldeDisponiblePot(supabase, input.equipeId, input.totalDisponible)
    if (input.montantDemande > soldeDisponible) {
      return {
        success: false,
        error: `Montant demandé (${input.montantDemande.toFixed(2)}€) supérieur au solde disponible (${soldeDisponible.toFixed(2)}€)`,
      }
    }

    // Validation champs obligatoires
    if (!input.motif.trim()) return { success: false, error: 'Le motif est obligatoire' }
    if (!input.prestataireNom.trim()) return { success: false, error: 'Le nom du prestataire est obligatoire' }
    if (!input.justificatifUrl) return { success: false, error: 'Le justificatif est obligatoire' }

    // Insertion
    const { data, error: insertError } = await supabase
      .from('demandes_pot_equipe')
      .insert({
        equipe_id: input.equipeId,
        created_by: user.id,
        motif: input.motif.trim(),
        prestataire_nom: input.prestataireNom.trim(),
        montant_demande: input.montantDemande,
        justificatif_url: input.justificatifUrl,
        justificatif_est_provisoire: input.justificatifEstProvisoire ?? false,
        statut: 'soumise',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('soumettreDemandeAction insert error:', insertError)
      return { success: false, error: 'Erreur lors de la création de la demande' }
    }

    // Email au trésorier
    const tresorierEmail = await getTresorierEmail(supabase)
    const chefName = profile.full_name ?? profile.display_name ?? 'Chef d\'équipe'
    if (tresorierEmail) {
      await sendEmail({
        to: tresorierEmail,
        subject: `Nouvelle demande de dépense pot d'équipe — ${input.prestataireNom}`,
        html: `
          <p>Bonjour,</p>
          <p><strong>${chefName}</strong> a soumis une demande de dépense sur le pot d'équipe :</p>
          <ul>
            <li><strong>Prestataire :</strong> ${input.prestataireNom}</li>
            <li><strong>Motif :</strong> ${input.motif}</li>
            <li><strong>Montant demandé :</strong> ${input.montantDemande.toFixed(2)} €</li>
            <li><strong>Justificatif :</strong> ${input.justificatifEstProvisoire ? 'Devis provisoire' : 'Document définitif'}</li>
          </ul>
          <p>Connectez-vous à l'espace trésorerie pour approuver ou rejeter cette demande.</p>
        `,
      })
    }

    revalidatePath('/tresorerie')
    revalidatePath('/mon-compte')

    return { success: true, data: { id: data.id } }
  } catch (err) {
    console.error('soumettreDemandeAction error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' }
  }
}

// =====================================================
// ACTION TRÉSORIER : APPROUVER
// =====================================================

/**
 * Approuve une demande de dépense pot d'équipe
 * Trésorier uniquement
 */
export async function approuverDemandeAction(
  demandeId: string,
  notesTresorier?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Non authentifié' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return { success: false, error: 'Réservé au trésorier' }
    }

    // Récupérer la demande pour notifier le chef
    const { data: demande, error: fetchError } = await supabase
      .from('demandes_pot_equipe')
      .select('*, chef:created_by ( id, full_name, display_name, email )')
      .eq('id', demandeId)
      .single()

    if (fetchError || !demande) {
      return { success: false, error: 'Demande introuvable' }
    }

    if (demande.statut !== 'soumise') {
      return { success: false, error: 'Seules les demandes au statut "soumise" peuvent être approuvées' }
    }

    const { error: updateError } = await supabase
      .from('demandes_pot_equipe')
      .update({
        statut: 'approuvée',
        traite_par: user.id,
        notes_tresorier: notesTresorier?.trim() || null,
      })
      .eq('id', demandeId)

    if (updateError) {
      console.error('approuverDemandeAction error:', updateError)
      return { success: false, error: 'Erreur lors de l\'approbation' }
    }

    // Email au chef
    const chef = demande.chef as { email?: string | null; full_name?: string | null; display_name?: string | null } | null
    if (chef?.email) {
      await sendEmail({
        to: chef.email,
        subject: `Demande de dépense approuvée — ${demande.prestataire_nom}`,
        html: `
          <p>Bonjour ${chef.full_name ?? chef.display_name ?? ''},</p>
          <p>Votre demande de dépense a été <strong>approuvée</strong> par le trésorier.</p>
          <ul>
            <li><strong>Prestataire :</strong> ${demande.prestataire_nom}</li>
            <li><strong>Montant :</strong> ${Number(demande.montant_demande).toFixed(2)} €</li>
            ${notesTresorier ? `<li><strong>Note du trésorier :</strong> ${notesTresorier}</li>` : ''}
          </ul>
          <p>Le paiement sera effectué par le trésorier au nom de l'amicale.</p>
        `,
      })
    }

    revalidatePath('/tresorerie')
    revalidatePath('/mon-compte')

    return { success: true }
  } catch (err) {
    console.error('approuverDemandeAction error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' }
  }
}

// =====================================================
// ACTION TRÉSORIER : MARQUER PAYÉE
// =====================================================

/**
 * Marque une demande comme payée
 * Trésorier uniquement
 * montantPaye doit être ≤ montant_demande
 */
export async function marquerPayeePotAction(input: {
  demandeId: string
  montantPaye: number
  factureFinaleUrl?: string
  justificatifEstProvisoire?: boolean
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Non authentifié' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return { success: false, error: 'Réservé au trésorier' }
    }

    const { data: demande, error: fetchError } = await supabase
      .from('demandes_pot_equipe')
      .select('*, chef:created_by ( id, full_name, display_name, email )')
      .eq('id', input.demandeId)
      .single()

    if (fetchError || !demande) {
      return { success: false, error: 'Demande introuvable' }
    }

    if (!['soumise', 'approuvée'].includes(demande.statut)) {
      return { success: false, error: 'Seules les demandes soumises ou approuvées peuvent être marquées payées' }
    }

    if (input.montantPaye <= 0) {
      return { success: false, error: 'Le montant payé doit être supérieur à 0' }
    }

    // Règle bloquante : montantPaye > montant_demande
    if (input.montantPaye > Number(demande.montant_demande)) {
      return {
        success: false,
        error: `Le montant payé (${input.montantPaye.toFixed(2)}€) ne peut pas dépasser le montant demandé (${Number(demande.montant_demande).toFixed(2)}€). Créez une demande complémentaire pour l'écart.`,
      }
    }

    const updatePayload: Record<string, unknown> = {
      statut: 'payée',
      montant_paye: input.montantPaye,
      traite_par: user.id,
      paid_at: new Date().toISOString(),
    }

    if (input.factureFinaleUrl) {
      updatePayload.facture_finale_url = input.factureFinaleUrl
      updatePayload.justificatif_est_provisoire = false
    } else if (input.justificatifEstProvisoire !== undefined) {
      updatePayload.justificatif_est_provisoire = input.justificatifEstProvisoire
    }

    const { error: updateError } = await supabase
      .from('demandes_pot_equipe')
      .update(updatePayload)
      .eq('id', input.demandeId)

    if (updateError) {
      console.error('marquerPayeePotAction error:', updateError)
      return { success: false, error: 'Erreur lors du marquage comme payée' }
    }

    // Email au chef
    const chef = demande.chef as { email?: string | null; full_name?: string | null; display_name?: string | null } | null
    if (chef?.email) {
      await sendEmail({
        to: chef.email,
        subject: `Dépense pot d'équipe payée — ${demande.prestataire_nom}`,
        html: `
          <p>Bonjour ${chef.full_name ?? chef.display_name ?? ''},</p>
          <p>La dépense de votre pot d'équipe a été <strong>payée</strong> par le trésorier.</p>
          <ul>
            <li><strong>Prestataire :</strong> ${demande.prestataire_nom}</li>
            <li><strong>Montant payé :</strong> ${input.montantPaye.toFixed(2)} €</li>
          </ul>
          ${input.justificatifEstProvisoire && !input.factureFinaleUrl
            ? '<p>⚠️ La facture définitive n\'a pas encore été fournie. Merci de la transmettre au trésorier dès réception.</p>'
            : ''
          }
        `,
      })
    }

    revalidatePath('/tresorerie')
    revalidatePath('/mon-compte')

    return { success: true }
  } catch (err) {
    console.error('marquerPayeePotAction error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' }
  }
}

// =====================================================
// ACTION TRÉSORIER : REJETER
// =====================================================

/**
 * Rejette une demande de dépense pot d'équipe
 * Trésorier uniquement — motif obligatoire
 */
export async function rejeterDemandePotAction(
  demandeId: string,
  motifRejet: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'Non authentifié' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return { success: false, error: 'Réservé au trésorier' }
    }

    if (!motifRejet || motifRejet.trim().length < 5) {
      return { success: false, error: 'Le motif de rejet est obligatoire (minimum 5 caractères)' }
    }

    const { data: demande, error: fetchError } = await supabase
      .from('demandes_pot_equipe')
      .select('*, chef:created_by ( id, full_name, display_name, email )')
      .eq('id', demandeId)
      .single()

    if (fetchError || !demande) {
      return { success: false, error: 'Demande introuvable' }
    }

    if (!['soumise', 'approuvée'].includes(demande.statut)) {
      return { success: false, error: 'Seules les demandes soumises ou approuvées peuvent être rejetées' }
    }

    const { error: updateError } = await supabase
      .from('demandes_pot_equipe')
      .update({
        statut: 'rejetée',
        motif_rejet: motifRejet.trim(),
        traite_par: user.id,
      })
      .eq('id', demandeId)

    if (updateError) {
      console.error('rejeterDemandePotAction error:', updateError)
      return { success: false, error: 'Erreur lors du rejet' }
    }

    // Email au chef
    const chef = demande.chef as { email?: string | null; full_name?: string | null; display_name?: string | null } | null
    if (chef?.email) {
      await sendEmail({
        to: chef.email,
        subject: `Demande de dépense rejetée — ${demande.prestataire_nom}`,
        html: `
          <p>Bonjour ${chef.full_name ?? chef.display_name ?? ''},</p>
          <p>Votre demande de dépense sur le pot d'équipe a été <strong>rejetée</strong>.</p>
          <ul>
            <li><strong>Prestataire :</strong> ${demande.prestataire_nom}</li>
            <li><strong>Montant :</strong> ${Number(demande.montant_demande).toFixed(2)} €</li>
            <li><strong>Motif du rejet :</strong> ${motifRejet}</li>
          </ul>
          <p>Si vous avez des questions, contactez le trésorier.</p>
        `,
      })
    }

    revalidatePath('/tresorerie')
    revalidatePath('/mon-compte')

    return { success: true }
  } catch (err) {
    console.error('rejeterDemandePotAction error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Une erreur est survenue' }
  }
}

// =====================================================
// HELPER POUR CALCULER LE SOLDE DISPONIBLE
// (utilisé par le formulaire côté serveur)
// =====================================================

/**
 * Calcule le solde disponible du pot d'une équipe en tenant compte
 * des demandes déjà engagées (soumise + approuvée)
 */
export async function getSoldeDisponiblePotAction(equipeId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const potTournees = await getPotEquipeTournees(supabase, equipeId)
    const soldeAnterieur = await getSoldeAnterieur(supabase, equipeId, potTournees.annee_campagne)
    const totalDisponible = potTournees.part_equipe + soldeAnterieur

    return await getSoldeDisponiblePot(supabase, equipeId, totalDisponible)
  } catch {
    return 0
  }
}
