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

  // Vérifier que la tournée existe et appartient bien à l'utilisateur courant
  const { data: tournee, error: tourneeErr } = await supabase
    .from('tournees')
    .select('*, equipes(enable_retribution, pourcentage_minimum_pot)')
    .eq('id', data.tourneeId)
    .single()

  if (tourneeErr) throw new Error('Tournée introuvable')
  if (!tournee) throw new Error('Tournée introuvable')

  if (tournee.statut && tournee.statut !== 'active') {
    throw new Error('Tournée déjà clôturée')
  }

  if (!tournee.equipes?.enable_retribution) {
    throw new Error('Rétribution non activée pour cette équipe')
  }

  const minPot = tournee.equipes.pourcentage_minimum_pot ?? 0
  if (data.pourcentagePot < minPot) {
    throw new Error(`Le pourcentage doit être >= ${minPot}%`)
  }

  // Appel RPC
  const { data: result, error } = await supabase.rpc('cloturer_tournee_avec_retribution', {
    p_tournee_id: data.tourneeId,
    p_calendriers_vendus: data.calendriersVendus,
    p_montant_total: data.montantTotal,
    p_pourcentage_pot_equipe: data.pourcentagePot,
  })

  if (error) throw new Error(error.message)

  // Revalidation des pages concernées
  revalidatePath('/dashboard/ma-tournee')
  revalidatePath('/dashboard/mon-compte')

  return result
}
