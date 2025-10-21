"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPinned } from "lucide-react";

export function SectorMapSection() {
  return (
    <section id="carte-secteur" className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPinned className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Secteur opérationnel</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            21 communes desservies par le Centre de Secours de Clermont‑l&apos;Hérault
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="glass-card rounded-lg overflow-hidden"
        >
          {/* Placeholder visuel: remplacez l'URL par votre carte quand prête */}
          <div className="relative w-full h-[300px] md:h-[420px]">
            <Image
              src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/placeholders/carte_secteur_placeholder.webp"
              alt="Carte du secteur opérationnel"
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
            />
          </div>
        </motion.div>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          Carte indicative — version interactive à venir.
        </p>
      </div>
    </section>
  );
}


