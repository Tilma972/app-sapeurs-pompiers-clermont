import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PwaContainer } from '@/components/layouts/pwa/pwa-container'
import { DemandePotForm } from '@/components/equipe/demande-pot-form'
import { isTeamLeaderRole } from '@/lib/config'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Demander des fonds - Pot d\'équipe',
  description: 'Créer une demande d\'utilisation du pot d\'équipe',
}

export default async function DemanderFondsPage() {
  const supabase = await createClient()

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Récupérer le profil utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <PwaContainer>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur: profil utilisateur introuvable
            </AlertDescription>
          </Alert>
        </div>
      </PwaContainer>
    )
  }

  // Vérifier que l'utilisateur est chef d'équipe ou admin
  if (!isTeamLeaderRole(profile.role)) {
    return (
      <PwaContainer>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seuls les chefs d&apos;équipe peuvent créer des demandes de pot d&apos;équipe
            </AlertDescription>
          </Alert>
          <Button variant="outline" asChild>
            <Link href="/mon-compte" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à Mon Compte
            </Link>
          </Button>
        </div>
      </PwaContainer>
    )
  }

  // Vérifier que l'utilisateur a une équipe
  if (!profile.team_id) {
    return (
      <PwaContainer>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous devez être assigné à une équipe pour créer des demandes
            </AlertDescription>
          </Alert>
          <Button variant="outline" asChild>
            <Link href="/dashboard/profil" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Compléter mon profil
            </Link>
          </Button>
        </div>
      </PwaContainer>
    )
  }

  // Récupérer les informations de l'équipe
  const { data: equipe } = await supabase
    .from('equipes')
    .select('id, nom, numero, solde_pot_equipe')
    .eq('id', profile.team_id)
    .single()

  if (!equipe) {
    return (
      <PwaContainer>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Équipe introuvable
            </AlertDescription>
          </Alert>
        </div>
      </PwaContainer>
    )
  }

  return (
    <div className="flex flex-col">
      <PwaContainer>
        <div className="space-y-6 py-6">
          {/* Header */}
          <div className="space-y-2">
            <Button variant="ghost" asChild className="gap-2 -ml-2">
              <Link href="/mon-compte">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Demander des fonds</h1>
            <p className="text-muted-foreground">
              Créer une demande d&apos;utilisation du pot d&apos;équipe pour {equipe.nom}
            </p>
          </div>

          {/* Alerte si solde insuffisant */}
          {equipe.solde_pot_equipe <= 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Le pot d&apos;équipe est vide. Contactez le trésorier pour plus d&apos;informations.
              </AlertDescription>
            </Alert>
          )}

          {/* Formulaire */}
          <DemandePotForm soldePotEquipe={equipe.solde_pot_equipe} />
        </div>
      </PwaContainer>
    </div>
  )
}
