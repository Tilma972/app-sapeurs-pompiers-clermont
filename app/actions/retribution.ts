'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function cloturerTourneeAvecRetribution(data: {
  tourneeId: string
  calendriersVendus: number
  montantTotal: number
  pourcentagePot: number
}) {
  const supabase = await createClient()
  try {
    const { data: tournee, error: tourneeErr } = await supabase
      .from('tournees')
      .select('*, equipes(enable_retribution, pourcentage_minimum_pot)')
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

    const minPot = tournee.equipes.pourcentage_minimum_pot ?? 0
    if (data.pourcentagePot < minPot) {
      throw new Error(`Le pourcentage doit être au minimum de ${minPot}% (règle de l\'équipe)`) 
    }

    const { data: result, error } = await supabase.rpc('cloturer_tournee_avec_retribution', {
      p_tournee_id: data.tourneeId,
      p_calendriers_vendus: data.calendriersVendus,
      p_montant_total: data.montantTotal,
      p_pourcentage_pot_equipe: data.pourcentagePot,
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
