'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isTreasurerRole } from '@/lib/config'
import {
  CreerDemandeDepotInput,
  ValiderDemandeDepotInput,
  AnnulerDemandeDepotInput,
  EnregistrerDepotDirectInput,
} from '@/lib/types/depot-fonds'
import { getMontantNonDepose } from '@/lib/supabase/depot-fonds'
import { sendEmail } from '@/lib/email/resend-client'

/**
 * Créer une nouvelle demande de dépôt de fonds
 */
export async function creerDemandeDepotAction(input: CreerDemandeDepotInput) {
  const supabase = await createClient()

  try {
    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false as const, error: 'Non authentifié' }
    }

    // Validations
    if (input.montant_a_deposer <= 0) {
      return { ok: false as const, error: 'Le montant doit être supérieur à 0' }
    }

    if (input.montant_a_deposer > 10000) {
      return { ok: false as const, error: 'Le montant maximum est de 10 000€' }
    }

    // Vérifier que le montant demandé n'excède pas le montant non déposé
    const montantNonDepose = await getMontantNonDepose(supabase, user.id)
    if (input.montant_a_deposer > montantNonDepose) {
      return {
        ok: false as const,
        error: `Le montant demandé (${input.montant_a_deposer}€) dépasse le montant disponible (${montantNonDepose.toFixed(2)}€)`,
      }
    }

    // Créer la demande
    const { data: demande, error: insertError } = await supabase
      .from('demandes_depot_fonds')
      .insert({
        user_id: user.id,
        montant_a_deposer: input.montant_a_deposer,
        disponibilites_proposees: input.disponibilites_proposees || null,
        notes_utilisateur: input.notes_utilisateur || null,
        statut: 'en_attente',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création demande dépôt:', insertError)
      return { ok: false as const, error: 'Erreur lors de la création de la demande' }
    }

    // Récupérer les infos utilisateur pour l'email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, team')
      .eq('id', user.id)
      .single()

    // Envoyer email au trésorier
    try {
      // Récupérer l'email du trésorier
      const { data: tresorier } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'tresorier')
        .limit(1)
        .single()

      if (tresorier) {
        const { data: tresorierUser } = await supabase.auth.admin.getUserById(tresorier.id)

        if (tresorierUser?.user?.email) {
          await sendEmail({
            to: tresorierUser.user.email,
            subject: `🏦 Nouvelle demande de dépôt - ${profile?.full_name || 'Un sapeur-pompier'}`,
            html: `
              <h2>Nouvelle demande de dépôt de fonds</h2>
              <p><strong>${profile?.full_name || 'Un sapeur-pompier'}</strong> ${profile?.team ? `(${profile.team})` : ''} souhaite déposer des fonds collectés.</p>

              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Montant à déposer:</strong> ${input.montant_a_deposer.toFixed(2)}€</p>
                ${input.disponibilites_proposees ? `<p style="margin: 4px 0;"><strong>Disponibilités:</strong><br/>${input.disponibilites_proposees.replace(/\n/g, '<br/>')}</p>` : ''}
                ${input.notes_utilisateur ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${input.notes_utilisateur}</p>` : ''}
              </div>

              <p>Connectez-vous à votre dashboard trésorerie pour valider cette demande.</p>
            `,
            text: `Nouvelle demande de dépôt de fonds\n\n${profile?.full_name || 'Un sapeur-pompier'} souhaite déposer ${input.montant_a_deposer.toFixed(2)}€.\n\nDisponibilités: ${input.disponibilites_proposees || 'Non renseignées'}\n\nConnectez-vous pour valider.`,
          })
        }
      }
    } catch (emailError) {
      // Ne pas bloquer la création si l'email échoue
      console.error('Erreur envoi email trésorier (non-bloquante):', emailError)
    }

    revalidatePath('/mon-compte')
    revalidatePath('/tresorerie')

    return { ok: true as const, demande }
  } catch (err) {
    console.error('Erreur creerDemandeDepotAction:', err)
    const msg = (err as Error)?.message || 'Erreur lors de la création'
    return { ok: false as const, error: msg }
  }
}

/**
 * Valider une demande de dépôt (trésorier uniquement)
 */
export async function validerDemandeDepotAction(input: ValiderDemandeDepotInput) {
  const supabase = await createClient()

  try {
    // Vérifier l'authentification et le rôle
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false as const, error: 'Non authentifié' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return { ok: false as const, error: 'Accès réservé aux trésoriers' }
    }

    // Validations
    if (input.montant_recu < 0) {
      return { ok: false as const, error: 'Le montant reçu ne peut pas être négatif' }
    }

    // Appeler la fonction SQL pour valider
    const { data: result, error } = await supabase.rpc('valider_demande_depot', {
      p_demande_id: input.demande_id,
      p_montant_recu: input.montant_recu,
      p_notes_tresorier: input.notes_tresorier || null,
    })

    if (error) {
      console.error('Erreur RPC valider_demande_depot:', error)
      return { ok: false as const, error: error.message || 'Erreur lors de la validation' }
    }

    // Récupérer la demande pour l'email
    const { data: demande } = await supabase
      .from('demandes_depot_fonds')
      .select('user_id, montant_a_deposer, montant_recu, statut')
      .eq('id', input.demande_id)
      .single()

    // Envoyer email à l'utilisateur
    if (demande) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(demande.user_id)

        if (userData?.user?.email) {
          const ecart = (demande.montant_recu || 0) - demande.montant_a_deposer
          const hasEcart = Math.abs(ecart) >= 0.01

          await sendEmail({
            to: userData.user.email,
            subject: hasEcart ? '⚠️ Dépôt validé avec écart' : '✅ Dépôt validé',
            html: `
              <h2>Votre dépôt de fonds a été validé</h2>
              <p>Bonjour,</p>
              <p>Le trésorier a confirmé la réception de vos fonds.</p>

              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Montant déclaré:</strong> ${demande.montant_a_deposer.toFixed(2)}€</p>
                <p style="margin: 4px 0;"><strong>Montant reçu:</strong> ${(demande.montant_recu || 0).toFixed(2)}€</p>
                ${hasEcart ? `<p style="margin: 4px 0; color: #dc2626;"><strong>Écart:</strong> ${ecart > 0 ? '+' : ''}${ecart.toFixed(2)}€</p>` : ''}
                ${input.notes_tresorier ? `<p style="margin: 4px 0;"><strong>Notes du trésorier:</strong> ${input.notes_tresorier}</p>` : ''}
              </div>

              ${hasEcart ? '<p style="color: #dc2626;">⚠️ Un écart a été détecté. Contactez le trésorier si nécessaire.</p>' : '<p>✅ Aucun écart détecté.</p>'}
            `,
            text: `Votre dépôt a été validé\n\nMontant déclaré: ${demande.montant_a_deposer.toFixed(2)}€\nMontant reçu: ${(demande.montant_recu || 0).toFixed(2)}€${hasEcart ? `\nÉcart: ${ecart.toFixed(2)}€` : ''}`,
          })
        }
      } catch (emailError) {
        console.error('Erreur envoi email utilisateur (non-bloquante):', emailError)
      }
    }

    revalidatePath('/mon-compte')
    revalidatePath('/tresorerie')

    return { ok: true as const, result }
  } catch (err) {
    console.error('Erreur validerDemandeDepotAction:', err)
    const msg = (err as Error)?.message || 'Erreur lors de la validation'
    return { ok: false as const, error: msg }
  }
}

/**
 * Annuler une demande de dépôt (utilisateur uniquement si en_attente)
 */
export async function annulerDemandeDepotAction(input: AnnulerDemandeDepotInput) {
  const supabase = await createClient()

  try {
    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false as const, error: 'Non authentifié' }
    }

    // Vérifier que la demande appartient à l'utilisateur et est en attente
    const { data: demande, error: fetchError } = await supabase
      .from('demandes_depot_fonds')
      .select('user_id, statut')
      .eq('id', input.demande_id)
      .single()

    if (fetchError || !demande) {
      return { ok: false as const, error: 'Demande introuvable' }
    }

    if (demande.user_id !== user.id) {
      return { ok: false as const, error: 'Vous ne pouvez pas annuler cette demande' }
    }

    if (demande.statut !== 'en_attente') {
      return { ok: false as const, error: 'Seules les demandes en attente peuvent être annulées' }
    }

    // Annuler la demande
    const { error: updateError } = await supabase
      .from('demandes_depot_fonds')
      .update({
        statut: 'annule',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.demande_id)

    if (updateError) {
      console.error('Erreur annulation demande:', updateError)
      return { ok: false as const, error: 'Erreur lors de l\'annulation' }
    }

    revalidatePath('/mon-compte')
    revalidatePath('/tresorerie')

    return { ok: true as const }
  } catch (err) {
    console.error('Erreur annulerDemandeDepotAction:', err)
    const msg = (err as Error)?.message || 'Erreur lors de l\'annulation'
    return { ok: false as const, error: msg }
  }
}

/**
 * Enregistrer un dépôt direct (trésorier uniquement)
 * Pour les utilisateurs qui viennent en permanence sans demande préalable
 */
export async function enregistrerDepotDirectAction(input: EnregistrerDepotDirectInput) {
  const supabase = await createClient()

  try {
    // Vérifier l'authentification et le rôle
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false as const, error: 'Non authentifié' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return { ok: false as const, error: 'Accès réservé aux trésoriers' }
    }

    // Validations
    if (input.montant_recu <= 0) {
      return { ok: false as const, error: 'Le montant doit être supérieur à 0' }
    }

    // Récupérer le montant non déposé de l'utilisateur
    const montantNonDepose = await getMontantNonDepose(supabase, input.user_id)

    if (montantNonDepose <= 0) {
      return {
        ok: false as const,
        error: 'Cet utilisateur n\'a pas de fonds à déposer',
      }
    }

    // Créer ET valider la demande en une seule fois
    const { data: demande, error: insertError } = await supabase
      .from('demandes_depot_fonds')
      .insert({
        user_id: input.user_id,
        montant_a_deposer: input.montant_recu, // On suppose que le montant reçu est correct
        montant_recu: input.montant_recu,
        statut: 'valide', // Directement validé
        valide_par: user.id,
        valide_le: new Date().toISOString(),
        notes_tresorier: input.notes_tresorier || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création dépôt direct:', insertError)
      return { ok: false as const, error: 'Erreur lors de l\'enregistrement du dépôt' }
    }

    // Envoyer email à l'utilisateur
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(input.user_id)

      if (userData?.user?.email) {
        await sendEmail({
          to: userData.user.email,
          subject: '✅ Dépôt de fonds enregistré',
          html: `
            <h2>Votre dépôt de fonds a été enregistré</h2>
            <p>Bonjour,</p>
            <p>Le trésorier a confirmé la réception de vos fonds.</p>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Montant reçu:</strong> ${input.montant_recu.toFixed(2)}€</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              ${input.notes_tresorier ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${input.notes_tresorier}</p>` : ''}
            </div>

            <p>✅ Le dépôt a été enregistré avec succès.</p>
            <p>Vous pouvez consulter l'historique dans votre compte.</p>
          `,
          text: `Dépôt enregistré\n\nMontant reçu: ${input.montant_recu.toFixed(2)}€\nDate: ${new Date().toLocaleDateString('fr-FR')}\n\nLe dépôt a été enregistré avec succès.`,
        })
      }
    } catch (emailError) {
      console.error('Erreur envoi email utilisateur (non-bloquante):', emailError)
    }

    revalidatePath('/mon-compte')
    revalidatePath('/tresorerie')

    return { ok: true as const, demande }
  } catch (err) {
    console.error('Erreur enregistrerDepotDirectAction:', err)
    const msg = (err as Error)?.message || 'Erreur lors de l\'enregistrement'
    return { ok: false as const, error: msg }
  }
}
