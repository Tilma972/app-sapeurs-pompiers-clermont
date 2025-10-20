"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PremiumIcon } from "./premium-icon";
import { Handshake } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Données des partenaires - Entreprises locales
const partners = [
  {
    id: 1,
    name: "Hyper U Clermont",
    logo: "/logos/hyper-u.png",
    description: "Supermarché local",
    website: "#"
  },
  {
    id: 2,
    name: "Intermarché",
    logo: "/logos/intermarche.png",
    description: "Supermarché de proximité",
    website: "#"
  },
  {
    id: 3,
    name: "Pharmacie du Centre",
    logo: "/logos/pharmacie-centre.png",
    description: "Pharmacie de Clermont-l'Hérault",
    website: "#"
  },
  {
    id: 4,
    name: "Garage Auto Service",
    logo: "/logos/garage-auto.png",
    description: "Garage automobile local",
    website: "#"
  },
  {
    id: 5,
    name: "Boulangerie Artisanale",
    logo: "/logos/boulangerie.png",
    description: "Boulangerie traditionnelle",
    website: "#"
  },
  {
    id: 6,
    name: "Café de la Place",
    logo: "/logos/cafe-place.png",
    description: "Café-restaurant local",
    website: "#"
  },
  {
    id: 7,
    name: "Électricité Hérault",
    logo: "/logos/electricite-herault.png",
    description: "Électricien local",
    website: "#"
  },
  {
    id: 8,
    name: "Plomberie 34",
    logo: "/logos/plomberie-34.png",
    description: "Plombier de Clermont",
    website: "#"
  }
];

export function PartnersSection() {
  return (
    <section id="partenaires" className="py-12" style={{ backgroundColor: '#B8AEA3' }}>
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header harmonisé */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Handshake className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#453E38' }}>Nos partenaires</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#453E38' }}>
            Ils nous soutiennent dans notre mission de solidarité
          </p>
        </motion.div>

        {/* Défilement horizontal des logos */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex space-x-8"
            animate={{
              x: [0, -100 * partners.length]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20,
                ease: "linear"
              }
            }}
          >
            {/* Premier set de logos */}
            {partners.map((partner) => (
              <motion.div
                key={partner.id}
                className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold text-lg">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">
                    {partner.name}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {/* Deuxième set de logos pour le défilement continu */}
            {partners.map((partner) => (
              <motion.div
                key={`duplicate-${partner.id}`}
                className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold text-lg">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">
                    {partner.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Appel à devenir partenaire + Message de remerciement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-base" style={{ color: '#453E38' }}>
            Merci à tous nos partenaires pour leur soutien et leur confiance
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/partenaires/devenir">Devenir partenaire</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:contact@amicale-sp-clermont.fr">Nous écrire</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
