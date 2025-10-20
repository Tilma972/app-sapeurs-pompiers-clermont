"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifiedCard } from "@/components/landing/unified-card";

const products = [
  {
    id: 1,
    name: "Calendrier 2024",
    description: "Calendrier officiel avec photos des équipes et véhicules",
    price: "15€",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/24_24.jpeg",
    category: "calendrier",
    featured: true
  },
  {
    id: 2,
    name: "Écusson Amicale",
    description: "Écusson brodé aux couleurs de l'amicale",
    price: "8€",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/logo/logo_amicale.svg",
    category: "ecusson",
    featured: false
  },
  {
    id: 3,
    name: "T-shirt Pompier",
    description: "T-shirt 100% coton avec logo de l'amicale",
    price: "20€",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/coeur_action.webp",
    category: "goodies",
    featured: false
  }
];

// Helpers retirés pour version compacte

export function ShopSection() {
  const featuredProduct = products[0];
  return (
    <section id="boutique" className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={ShoppingCart} variant="gradient" size="md" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Boutique</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Produits officiels au profit de l&apos;amicale
          </p>
        </motion.div>

        {/* Grille de produits cohérente avec les autres sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.slice(0, 3).map((product, index) => (
            <UnifiedCard
              key={product.id}
              variant="product"
              title={product.name}
              description={product.description}
              image={product.image}
              badge={product.featured ? "En vedette" : undefined}
              className="h-full"
            >
              <div className="flex items-center justify-between mt-3">
                <span className="text-xl font-bold text-primary">{product.price}</span>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Commander
                </Button>
              </div>
            </UnifiedCard>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/boutique">Voir tous les produits</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


