"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { ShopProduct } from "@/data/shop-products"
import toast from "react-hot-toast"

export function ProductCard({ product }: { product: ShopProduct }) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
    toast.success(`${product.name} ajouté au panier`)
  }

  const badgeVariants = {
    preorder: "bg-accent-orange text-white",
    new: "bg-accent-turquoise text-white",
    promo: "bg-primary text-white",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
        <div className="relative h-40 sm:h-48 overflow-hidden bg-muted/30">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {product.badge && (
            <Badge 
              className={`absolute top-2 left-2 text-xs ${badgeVariants[product.badge.variant]}`}
            >
              {product.badge.text}
            </Badge>
          )}
        </div>
        <div className="p-3 sm:p-4 flex-grow flex flex-col">
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground flex-grow mb-2 sm:mb-3 line-clamp-2">
            {product.description}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-auto pt-2 border-t">
            <p className="text-lg sm:text-xl font-bold text-primary">
              {product.price.toFixed(2)} €
            </p>
            <Button 
              onClick={handleAddToCart}
              size="sm"
              className="gap-1.5 w-full sm:w-auto"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Ajouter au panier</span>
              <span className="xs:hidden">Ajouter</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
