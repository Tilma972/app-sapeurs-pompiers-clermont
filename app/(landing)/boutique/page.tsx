"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CartProvider, useCart } from "@/lib/cart-context"
import { ProductCard } from "@/components/shop/product-card"
import { CartModal } from "@/components/shop/cart-modal"
import { SHOP_PRODUCTS } from "@/data/shop-products"

function BoutiqueContent() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { totalItems } = useCart()

  return (
    <>
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

            {/* Header with Cart Button */}
            <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                  Notre Boutique
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Soutenez nos actions en vous procurant les produits de l&apos;Amicale.
                </p>
              </div>
              
              {/* Cart Button in Header */}
              <Button
                onClick={() => setIsCartOpen(true)}
                variant="outline"
                size="sm"
                className="relative shrink-0"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8 sm:pb-12">
              {SHOP_PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

export default function BoutiquePage() {
  return (
    <CartProvider>
      <BoutiqueContent />
    </CartProvider>
  )
}
