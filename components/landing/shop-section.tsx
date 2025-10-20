"use client";

import { PremiumIcon } from "@/components/landing/premium-icon";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={ShoppingCart} variant="gradient" size="md" />
          </div>
          <h2 className="text-2xl font-bold">Boutique</h2>
        </div>

        <Card className="overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="relative w-28 h-28 flex-shrink-0">
              <Image src={featuredProduct.image} alt={featuredProduct.name} fill className="rounded-lg object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge className="mb-1 w-fit">En vedette</Badge>
              <h3 className="font-bold mb-1 truncate">{featuredProduct.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{featuredProduct.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary">{featuredProduct.price}</span>
                <Button size="sm">Commander</Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mt-4">
          <Button variant="outline" asChild>
            <Link href="/boutique">Voir tous les produits</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


