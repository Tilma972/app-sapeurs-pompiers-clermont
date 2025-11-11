"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CartProvider, useCart } from "@/lib/cart-context"
import { ProductCard } from "@/components/shop/product-card"
import { CartModal } from "@/components/shop/cart-modal"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface BoutiqueClientProps {
  products: Product[]
}

function BoutiqueContent({ products }: BoutiqueClientProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { totalItems } = useCart()

  // Transform DB products to ShopProduct format for ProductCard
  const shopProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description || '',
    price: product.price,
    image: product.image_url || '',
    badge: product.badge_text ? {
      text: product.badge_text,
      variant: product.badge_variant as 'preorder' | 'new' | 'promo' || 'new'
    } : undefined,
    stock: product.stock,
    status: product.status
  }))

  return (
    <>
      {/* Header with Cart Button */}
      <div className="flex items-center justify-end gap-3 mb-6 sm:mb-8">
        <Button
          onClick={() => setIsCartOpen(true)}
          variant="outline"
          size="sm"
          className="relative"
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
        {shopProducts.length > 0 ? (
          shopProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

export function BoutiqueClient({ products }: BoutiqueClientProps) {
  return (
    <CartProvider>
      <BoutiqueContent products={products} />
    </CartProvider>
  )
}
