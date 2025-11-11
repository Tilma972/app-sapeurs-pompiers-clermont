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
        <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-muted/30 flex items-center justify-center p-4">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
          {product.badge && (
            <Badge 
              className={`absolute top-3 right-3 text-xs z-10 font-semibold shadow-lg ${badgeVariants[product.badge.variant]}`}
            >
              {product.badge.text}
            </Badge>
          )}
        </div>
        <div className="p-4 sm:p-5 flex-grow flex flex-col">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground flex-grow mb-3 sm:mb-4 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t">
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {product.price.toFixed(2)} €
            </p>
            <Button 
              onClick={handleAddToCart}
              size="default"
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
