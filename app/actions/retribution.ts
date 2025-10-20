'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function cloturerTourneeAvecRetribution(data: {
  tourneeId: string
  calendriersVendus: number
  montantTotal: number
}) {
  const supabase = await createClient()
  try {
    const { data: tournee, error: tourneeErr } = await supabase
      .from('tournees')
      .select('*, equipes(enable_retribution)')
      .eq('id', data.tourneeId)
      .single()

    if (tourneeErr) {
      console.error('Erreur chargement tournée:', tourneeErr)
      throw new Error('Tournée introuvable')
    }
    if (!tournee) throw new Error('Tournée introuvable')

    if (tournee.statut && tournee.statut !== 'active') {
      throw new Error('Cette tournée est déjà clôturée')
    }

    if (!tournee.equipes?.enable_retribution) {
      throw new Error('La rétribution n\'est pas activée pour votre équipe')
    }

    const { data: result, error } = await supabase.rpc('cloturer_tournee_avec_retribution', {
      p_tournee_id: data.tourneeId,
      p_calendriers_vendus: data.calendriersVendus,
      p_montant_total: data.montantTotal,
    })

    if (error) {
      console.error('Erreur RPC:', error)
      throw new Error(error.message || 'Erreur lors de la clôture')
    }

    revalidatePath('/dashboard/ma-tournee')
    revalidatePath('/dashboard/mon-compte')
    return result
  } catch (err) {
    console.error('Erreur clôture:', err)
    throw err
  }
}

export async function updateRetributionPreference(pourcentage: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  if (pourcentage < 0 || pourcentage > 100) {
    throw new Error('Le pourcentage doit être entre 0 et 100')
  }

  // Vérifier le minimum d'équipe pour l'utilisateur
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('team_id, equipes(pourcentage_minimum_pot)')
    .eq('id', user.id)
    .single()

  if (profileErr) {
    console.error('Erreur chargement profil:', profileErr)
  }

  const minimumEquipe: number = (profile && (profile as { equipes?: { pourcentage_minimum_pot?: number } }).equipes?.pourcentage_minimum_pot) ?? 0
  if (pourcentage < minimumEquipe) {
    throw new Error(`Le minimum imposé par votre équipe est de ${minimumEquipe}%`)
  }

  const { error } = await supabase
    .from('comptes_sp')
    .upsert({
      user_id: user.id,
      pourcentage_pot_equipe_defaut: pourcentage,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Erreur mise à jour préférence:', error)
    throw new Error('Erreur lors de la mise à jour')
  }

  revalidatePath('/dashboard/mon-compte')
  return { success: true }
}
