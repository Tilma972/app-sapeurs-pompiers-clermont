'use server'

/**
 * Server Actions pour la gestion des soldes antérieurs de pot d'équipe
 * Réservé aux rôles trésorier et admin
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isTreasurerRole } from '@/lib/config'

type ActionResult<T = void> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Upsert du solde antérieur d'une équipe pour une année donnée.
 * Crée la ligne si elle n'existe pas, la met à jour sinon
 * (grâce à la contrainte UNIQUE(equipe_id, annee) + ON CONFLICT DO UPDATE).
 */
export async function upsertSoldeAnterieurAction(input: {
  equipeId: string
  annee: number
  solde: number
  notes?: string
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Vérification de l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérification du rôle (trésorier ou admin uniquement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isTreasurerRole(profile.role)) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour cette action",
      }
    }

    // Validation métier
    const currentYear = new Date().getFullYear()
    if (input.annee < 2020 || input.annee > currentYear + 1) {
      return { success: false, error: 'Année invalide' }
    }

    // Upsert avec ON CONFLICT sur la contrainte UNIQUE(equipe_id, annee)
    const { data, error: upsertError } = await supabase
      .from('pots_equipe_historique')
      .upsert(
        {
          equipe_id: input.equipeId,
          annee: input.annee,
          solde_anterieur: input.solde,
          notes: input.notes ?? null,
          created_by: user.id,
        },
        {
          onConflict: 'equipe_id,annee',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error('Erreur upsert solde antérieur:', upsertError)
      return { success: false, error: 'Erreur lors de la sauvegarde' }
    }

    revalidatePath('/tresorerie')
    revalidatePath('/mon-compte')

    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Error in upsertSoldeAnterieurAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue',
    }
  }
}
