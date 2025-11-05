"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { 
  hasVerifiedIdentity, 
  hasCompleteIdentity,
  getIdentityRequiredMessage,
  type Profile 
} from "@/lib/utils/profile-helpers"

interface IdentityRequiredAlertProps {
  profile: Profile | null | undefined
  feature: 'partner_offers' | 'official_documents' | 'events' | 'general'
  className?: string
}

export function IdentityRequiredAlert({ 
  profile, 
  feature,
  className 
}: IdentityRequiredAlertProps) {
  // Si l'identité est vérifiée, ne rien afficher
  if (hasVerifiedIdentity(profile)) {
    return null
  }

  const isComplete = hasCompleteIdentity(profile)
  const message = getIdentityRequiredMessage(feature)

  // Si l'identité est complète mais pas vérifiée
  if (isComplete) {
    return (
      <Alert className={className}>
        <Shield className="h-4 w-4" />
        <AlertTitle>Vérification en cours</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            Votre identité est en attente de vérification par un administrateur.
          </p>
          <p className="text-sm text-muted-foreground">
            Vous recevrez une notification dès que la vérification sera terminée.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Si l'identité n'est pas fournie
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Identité requise</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{message}</p>
        <p className="mb-4 text-sm">
          Veuillez compléter votre identité pour accéder à cette fonctionnalité.
        </p>
        <Button asChild size="sm">
          <Link href="/profil">
            <Shield className="mr-2 h-4 w-4" />
            Compléter mon identité
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
