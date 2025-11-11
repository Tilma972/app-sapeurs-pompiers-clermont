import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoutiqueClient } from "@/app/(landing)/boutique/boutique-client"

export const revalidate = 0 // Désactiver le cache pour toujours avoir les derniers produits

async function getProducts() {
  const supabase = await createClient()
  
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error loading products:", error)
    return []
  }
  
  return products || []
}

export default async function BoutiquePage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Notre Boutique
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Soutenez nos actions en vous procurant les produits de l&apos;Amicale.
            </p>
          </div>

          {/* Client Component with products */}
          <BoutiqueClient products={products} />
        </div>
      </div>
    </div>
  )
}
