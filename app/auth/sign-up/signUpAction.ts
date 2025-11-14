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

  // Normalisation des données (sécurité + cohérence)
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedFirstName = firstName.trim()
  const normalizedLastName = lastName.trim()

  console.log('🔍 Tentative inscription:', {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail
  })

  const supabase = createClient()

  // Appel fonction SQL transactionnelle avec vérification EMAIL + NOM + PRÉNOM
  // La fonction SQL fait lower() donc la casse n'a pas d'importance
  const { data: whitelistData, error: whitelistError } = await supabase
    .rpc('claim_whitelist_entry', {
      p_first_name: normalizedFirstName,
      p_last_name: normalizedLastName,
      p_email: normalizedEmail
    })

  console.log('📋 Résultat whitelist:', { whitelistData, whitelistError })

  if (whitelistError) {
    console.error('❌ Whitelist claim error:', whitelistError)
    return { error: "Erreur lors de la vérification de la whitelist" }
  }

  // Vérifier si une entrée a été trouvée
  if (!whitelistData || whitelistData.length === 0) {
    console.warn('⚠️ Aucune entrée whitelist trouvée')
    return {
      error: `Aucune inscription trouvée pour ${normalizedFirstName} ${normalizedLastName} avec l'email ${normalizedEmail}. Vérifie l'orthographe de tes informations ou contacte un administrateur.`
    }
  }

  const whitelistEntry = whitelistData[0]

  // Créer compte auth
  const { error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: `${normalizedFirstName} ${normalizedLastName}`,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
      }
    }
  })

  if (authError) {
    // Rollback whitelist si signup échoue
    if (whitelistEntry && whitelistEntry.id) {
      await supabase
        .from('whitelist')
        .update({ used: false, used_at: null })
        .eq('id', whitelistEntry.id)
    }
    return { error: authError.message }
  }

  return { success: true }
}
