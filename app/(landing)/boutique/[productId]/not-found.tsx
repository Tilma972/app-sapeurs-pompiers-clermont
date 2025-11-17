import Link from "next/link"
import { ArrowLeft, PackageX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ProductNotFound() {
  return (
    <div className="min-h-screen py-8 sm:py-16">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 sm:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-muted p-6">
                <PackageX className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Produit introuvable
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              Désolé, le produit que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
            </p>

            <Button asChild size="lg" className="gap-2">
              <Link href="/boutique">
                <ArrowLeft className="h-4 w-4" />
                Retour à la boutique
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
