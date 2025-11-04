/**
 * Composant Error Boundary pour Next.js 15
 * Affiche une page d'erreur élégante quand une erreur se produit
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur pour le monitoring
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Une erreur est survenue</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nous sommes désolés, une erreur inattendue s&apos;est produite.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-3 rounded-md">
              <summary className="cursor-pointer font-medium mb-2">
                Détails de l&apos;erreur (dev only)
              </summary>
              <pre className="overflow-auto">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1"
            >
              Réessayer
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="flex-1"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
