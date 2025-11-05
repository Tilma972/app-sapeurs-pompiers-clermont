"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { 
  hasCompleteIdentity, 
  hasVerifiedIdentity, 
  getVerificationStatus,
  formatVerificationDate,
  getVerificationMethodLabel,
  type Profile 
} from "@/lib/utils/profile-helpers"
import { completeIdentity } from "@/app/actions/profile/complete-identity"
import toast from "react-hot-toast"

interface CompleteIdentityFormProps {
  profile: Profile
  onSuccess?: () => void
}

export function CompleteIdentityForm({ profile, onSuccess }: CompleteIdentityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    display_name: profile.display_name || profile.full_name || "",
  })

  const verificationStatus = getVerificationStatus(profile)
  const isVerified = hasVerifiedIdentity(profile)
  const isComplete = hasCompleteIdentity(profile)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Le prénom et le nom sont requis")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await completeIdentity({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        display_name: formData.display_name.trim() || null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Identité enregistrée avec succès")
      onSuccess?.()
    } catch (error) {
      console.error("Error completing identity:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si l'identité est vérifiée, afficher le statut
  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-green-900 dark:text-green-100">
              Identité vérifiée
            </CardTitle>
          </div>
          <CardDescription className="text-green-700 dark:text-green-300">
            Votre identité a été vérifiée par l&apos;administration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Nom complet
            </p>
            <p className="text-lg text-green-800 dark:text-green-200">
              {profile.first_name} {profile.last_name}
            </p>
          </div>

          {profile.display_name && (
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Nom d&apos;affichage
              </p>
              <p className="text-green-800 dark:text-green-200">
                {profile.display_name}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge className="bg-green-600 hover:bg-green-700">
              ✓ Offres partenaires
            </Badge>
            <Badge className="bg-green-600 hover:bg-green-700">
              ✓ Documents officiels
            </Badge>
          </div>

          {profile.verification_date && (
            <p className="text-xs text-green-700 dark:text-green-400 pt-2">
              Vérifié le {formatVerificationDate(profile)} •{" "}
              {getVerificationMethodLabel(profile.verification_method)}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Si l'identité est complète mais pas vérifiée
  if (isComplete) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              En attente de vérification
            </CardTitle>
          </div>
          <CardDescription className="text-yellow-700 dark:text-yellow-300">
            Votre identité sera vérifiée par un administrateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Nom fourni
            </p>
            <p className="text-lg text-yellow-800 dark:text-yellow-200">
              {profile.first_name} {profile.last_name}
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Vérification en cours</AlertTitle>
            <AlertDescription>
              Un administrateur va vérifier votre identité prochainement. 
              Vous recevrez une notification une fois la vérification terminée.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Formulaire de complétion
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle>Complétez votre identité</CardTitle>
        </div>
        <CardDescription>
          Votre identité réelle est nécessaire pour accéder aux offres partenaires 
          et recevoir des documents officiels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertTitle>Pourquoi ces informations ?</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>Accéder aux offres partenaires exclusives</li>
              <li>Recevoir des documents officiels (reçus fiscaux, cartes)</li>
              <li>Participer aux événements de l&apos;amicale</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Ces informations sont confidentielles et ne seront utilisées que pour 
              la gestion administrative de l&apos;amicale.
            </p>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Jean"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Dupont"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">
              Nom d&apos;affichage (optionnel)
            </Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Pseudo ou surnom"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Le nom qui sera affiché publiquement. Si vide, votre prénom sera utilisé.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Enregistrer mon identité
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
