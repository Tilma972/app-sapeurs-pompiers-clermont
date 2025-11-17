"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ShoppingCart, Minus, Plus, Package, Info } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import type { Database } from "@/lib/database.types"
import toast from "react-hot-toast"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "",
      })
    }
    toast.success(`${quantity} × ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier`)
  }

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const badgeVariants = {
    preorder: "bg-accent-orange text-white",
    new: "bg-accent-turquoise text-white",
    promo: "bg-primary text-white",
  }

  const stockStatusVariants = {
    in_stock: { color: "text-green-600", text: "En stock" },
    low_stock: { color: "text-orange-600", text: "Stock limité" },
    out_of_stock: { color: "text-red-600", text: "En rupture de stock" },
  }

  const stockStatus = stockStatusVariants[product.status as keyof typeof stockStatusVariants] || stockStatusVariants.in_stock

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
              <Link href="/boutique">
                <ArrowLeft className="h-4 w-4" /> Retour à la boutique
              </Link>
            </Button>
          </motion.div>

          {/* Product Detail Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12"
          >
            {/* Image Section - Left Side */}
            <div className="w-full">
              <Card className="overflow-hidden sticky top-4">
                <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center p-4 sm:p-8">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.badge_text && (
                    <Badge
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 text-xs sm:text-sm z-10 font-semibold shadow-lg ${
                        badgeVariants[product.badge_variant as keyof typeof badgeVariants] || badgeVariants.new
                      }`}
                    >
                      {product.badge_text}
                    </Badge>
                  )}
                </div>
              </Card>
            </div>

            {/* Info Section - Right Side */}
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Category */}
              <div>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {product.category}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                  {product.price.toFixed(2)} €
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <Info className={`h-5 w-5 ${stockStatus.color}`} />
                <span className={`text-sm sm:text-base font-medium ${stockStatus.color}`}>
                  {stockStatus.text}
                  {product.status !== "out_of_stock" && (
                    <span className="text-muted-foreground ml-2">
                      ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <Card className="p-4 sm:p-6 bg-muted/30">
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Description</h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </Card>
              )}

              {/* Quantity Selector & Add to Cart */}
              {product.status !== "out_of_stock" && (
                <Card className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Quantity */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantité</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="h-10 w-10 sm:h-12 sm:w-12"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl sm:text-2xl font-bold min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={incrementQuantity}
                          disabled={quantity >= product.stock}
                          className="h-10 w-10 sm:h-12 sm:w-12"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={handleAddToCart}
                      size="lg"
                      className="w-full gap-2 text-base sm:text-lg h-12 sm:h-14"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Ajouter au panier
                      <span className="font-semibold ml-2">
                        {(product.price * quantity).toFixed(2)} €
                      </span>
                    </Button>
                  </div>
                </Card>
              )}

              {/* Out of Stock Message */}
              {product.status === "out_of_stock" && (
                <Card className="p-4 sm:p-6 bg-destructive/10 border-destructive/30">
                  <p className="text-sm sm:text-base text-center text-destructive font-medium">
                    Ce produit est actuellement en rupture de stock.
                  </p>
                </Card>
              )}

              {/* Additional Info */}
              <Card className="p-4 sm:p-6 bg-muted/20">
                <h3 className="font-semibold mb-3 text-sm sm:text-base">Informations</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>✓ Paiement sécurisé via Stripe</li>
                  <li>✓ Support de l&apos;Amicale des Sapeurs-Pompiers</li>
                  <li>✓ Produit officiel de l&apos;Amicale</li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
