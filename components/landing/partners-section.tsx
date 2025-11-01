"use client";

import { motion } from "framer-motion";
// import { Badge } from "@/components/ui/badge";
// import { PremiumIcon } from "./premium-icon";
import { Handshake } from "lucide-react";
import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
import { PrimaryCta } from "@/components/landing/primary-cta";
import { partners } from "@/data/partners";


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
                duration: 24,
                ease: "linear"
              }
            }}
          >
            {/* Premier set de logos */}
            {partners.map((partner) => (
              <motion.div
                key={partner.id}
                className="flex-shrink-0 w-32 h-20 flex items-center justify-center rounded-lg transition-transform"
                whileHover={{ scale: 1.05 }}
              >
                {partner.logo && partner.logo !== "" ? (
                  <a
                    href={partner.website !== "#" ? partner.website : undefined}
                    target={partner.website !== "#" ? "_blank" : undefined}
                    rel={partner.website !== "#" ? "noopener noreferrer" : undefined}
                    className="w-full h-full flex items-center justify-center p-2"
                  >
                    <div className="relative w-32 h-16">
                      <Image
                        src={partner.logo}
                        alt={`Logo ${partner.name}`}
                        fill
                        sizes="128px"
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                  </a>
                ) : (
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
                )}
              </motion.div>
            ))}
            
            {/* Deuxième set de logos pour le défilement continu */}
            {partners.map((partner) => (
              <motion.div
                key={`duplicate-${partner.id}`}
                className="flex-shrink-0 w-32 h-20 flex items-center justify-center rounded-lg transition-transform"
                whileHover={{ scale: 1.05 }}
              >
                {partner.logo && partner.logo !== "" ? (
                  <a
                    href={partner.website !== "#" ? partner.website : undefined}
                    target={partner.website !== "#" ? "_blank" : undefined}
                    rel={partner.website !== "#" ? "noopener noreferrer" : undefined}
                    className="w-full h-full flex items-center justify-center p-2"
                  >
                    <div className="relative w-32 h-16">
                      <Image
                        src={partner.logo}
                        alt={`Logo ${partner.name}`}
                        fill
                        sizes="128px"
                        className="object-contain drop-shadow-md"
                      />
                    </div>
                  </a>
                ) : (
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
                )}
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
            <PrimaryCta href="/dashboard/partenaires">Devenir partenaire</PrimaryCta>
            <PrimaryCta href="mailto:contact@amicale-sp-clermont.fr" variant="outline">Nous écrire</PrimaryCta>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
