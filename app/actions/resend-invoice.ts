'use server'

import { createClient } from '@/lib/supabase/server'
import { resendInvoice } from '@/lib/n8n/send-invoice'

export async function resendInvoiceAction(transactionId: string): Promise<{ success: boolean; error?: string }> {
  // Vérifier que l'utilisateur est admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Vérifier le rôle admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { success: false, error: 'Accès non autorisé' }
  }

  // Appeler la fonction de renvoi
  return await resendInvoice(transactionId)
}
