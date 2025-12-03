import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DemandeDepotForm } from '@/components/compte/demande-depot-form'
import { getMontantNonDepose } from '@/lib/supabase/depot-fonds'

export const metadata = {
  title: 'Demander un dépôt - Mon Compte',
  description: 'Demander un rendez-vous pour déposer les fonds collectés',
}

export default async function DemanderDepotPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le montant disponible pour dépôt
  let montantDisponible = 0
  try {
    montantDisponible = await getMontantNonDepose(supabase, user.id)
  } catch (err) {
    console.error('Erreur récupération montant non déposé:', err)
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demander un dépôt</h1>
        <p className="text-muted-foreground mt-2">
          Organisez un rendez-vous avec le trésorier pour remettre les fonds collectés
        </p>
      </div>

      <DemandeDepotForm montantDisponible={montantDisponible} />
    </div>
  )
}
