"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { ShoppingCart, Calendar, Award, Heart, ExternalLink } from "lucide-react";
import Image from "next/image";

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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "calendrier":
      return Calendar;
    case "ecusson":
      return Award;
    default:
      return Heart;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "calendrier":
      return "icon-target";
    case "ecusson":
      return "icon-award";
    default:
      return "icon-heart";
  }
};

export function ShopSection() {
  return (
    <section id="boutique" className="py-20 bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <PremiumIcon
              icon={ShoppingCart}
              variant="gradient"
              size="lg"
              className="icon-heart"
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Boutique de l&apos;amicale
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Soutenez l&apos;amicale en achetant nos produits. Chaque achat contribue à nos actions de solidarité.
          </p>
        </motion.div>

        {/* Produits en vedette */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 group hover:scale-105 transition-all duration-300 relative"
            >
              {/* Badge produit en vedette */}
              {product.featured && (
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  En vedette
                </div>
              )}

              {/* Image du produit */}
              <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Icône de catégorie */}
              <div className="flex items-center gap-2 mb-3">
                <PremiumIcon
                  icon={getCategoryIcon(product.category)}
                  variant="minimal"
                  size="sm"
                  className={getCategoryColor(product.category)}
                />
                <span className="text-sm text-muted-foreground capitalize">
                  {product.category}
                </span>
              </div>

              {/* Informations du produit */}
              <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Prix et bouton */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {product.price}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Commander
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informations importantes */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-card p-6 text-center">
              <PremiumIcon
                icon={Heart}
                variant="glass"
                size="md"
                className="icon-heart mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Solidarité
              </h3>
              <p className="text-sm text-muted-foreground">
                100% des bénéfices vont à l&apos;amicale pour soutenir nos actions
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <PremiumIcon
                icon={Award}
                variant="glass"
                size="md"
                className="icon-award mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Qualité
              </h3>
              <p className="text-sm text-muted-foreground">
                Produits de qualité, fabriqués localement quand possible
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <PremiumIcon
                icon={Calendar}
                variant="glass"
                size="md"
                className="icon-target mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Livraison
              </h3>
              <p className="text-sm text-muted-foreground">
                Retrait sur place ou livraison locale gratuite
              </p>
            </div>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Commandes et informations
            </h3>
            <p className="text-muted-foreground mb-6">
              Pour passer commande ou obtenir plus d&apos;informations sur nos produits, contactez-nous directement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Voir tous les produits
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Nous contacter
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
