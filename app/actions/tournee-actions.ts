'use server'

import { revalidatePath } from 'next/cache'
import { createNewActiveTournee } from '@/lib/supabase/tournee'

export async function startNewTournee(formData: FormData) {
  try {
    const zone = formData.get('zone') as string || 'Zone par défaut'
    
    const newTournee = await createNewActiveTournee(zone)
    
    if (!newTournee) {
      return { 
        success: false, 
        errors: ['Erreur lors de la création de la tournée'] 
      }
    }

    // Revalidation des pages
    revalidatePath('/dashboard/calendriers')
    revalidatePath('/dashboard/ma-tournee')

    return { 
      success: true, 
      tournee: newTournee,
      message: 'Tournée démarrée avec succès'
    }

  } catch (error) {
    console.error('Erreur serveur:', error)
    return { 
      success: false, 
      errors: ['Une erreur est survenue. Veuillez réessayer.'] 
    }
  }
}
