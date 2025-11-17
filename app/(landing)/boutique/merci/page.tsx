"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Package, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MerciBoutiquePage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Simulate verification of payment session
    const timer = setTimeout(() => {
      if (sessionId) {
        setLoading(false)
      } else {
        setError(true)
        setLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Une erreur est survenue
            </h1>
            <p className="text-muted-foreground mb-6">
              Nous n&apos;avons pas pu vérifier votre paiement. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
              veuillez nous contacter.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/boutique">Retour à la boutique</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Page d&apos;accueil</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-2xl px-4">
        <Card className="p-8 lg:p-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Merci pour votre commande !
            </h1>
            <p className="text-lg text-muted-foreground">
              Votre paiement a été effectué avec succès.
            </p>
          </div>

          {/* Order Details */}
          <div className="space-y-6 mb-8">
            <div className="bg-muted/50 rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Prochaines étapes
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">1.</span>
                  <span>Vous allez recevoir un email de confirmation à l&apos;adresse que vous avez fournie.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">2.</span>
                  <span>Notre équipe préparera votre commande dans les plus brefs délais.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">3.</span>
                  <span>Nous vous contacterons pour organiser la livraison ou le retrait de votre commande.</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Besoin d&apos;aide ?
              </h2>
              <p className="text-muted-foreground mb-4">
                Si vous avez des questions concernant votre commande, n&apos;hésitez pas à nous contacter.
              </p>
              <div className="text-sm space-y-1">
                <p className="font-medium">Email : contact@pompiers34800.com</p>
                <p className="font-medium">Tél : 01 23 45 67 89</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/boutique">Retour à la boutique</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Page d&apos;accueil</Link>
            </Button>
          </div>

          {/* Session ID (for debugging) */}
          {sessionId && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-xs text-muted-foreground text-center">
                ID de session : <code className="bg-muted px-2 py-1 rounded">{sessionId}</code>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
