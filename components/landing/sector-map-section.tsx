"use client";

import { motion } from "framer-motion";
import { MapPinned } from "lucide-react";
import dynamic from "next/dynamic";
const SectorMap = dynamic(() => import("./sector-map"), { ssr: false });

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
          <div className="relative w-full">
            <SectorMap />
          </div>
        </motion.div>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          Carte indicative — version interactive.
        </p>
      </div>
    </section>
  );
}


