import { createClient } from '@/lib/supabase/client'

export async function signUpAction({ email, password, firstName, lastName }: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  if (!email || !password || !firstName || !lastName) {
    return { error: "Tous les champs sont requis" }
  }

  const supabase = createClient()

  // Appel fonction SQL transactionnelle
  const { data: whitelistEntry, error: whitelistError } = await supabase
    .rpc('claim_whitelist_entry', {
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email
    })
    .single()

  if (whitelistError) {
    if (whitelistError.message && whitelistError.message.includes('not_whitelisted')) {
      return {
        error: "Votre inscription n'est pas autorisée. Contactez l'administrateur pour être ajouté à la liste."
      }
    }
    return { error: "Erreur lors de la vérification" }
  }

  // Créer compte auth
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (authError) {
    // Rollback whitelist si signup échoue
    const entry = whitelistEntry as { id: string }
    if (entry && entry.id) {
      await supabase
        .from('whitelist')
        .update({ used: false, used_at: null })
        .eq('id', entry.id)
    }
    return { error: authError.message }
  }

  return { success: true }
}
