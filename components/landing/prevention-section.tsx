"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Shield, Phone } from "lucide-react";
import React from "react";
import EmergencyGuideModal from "@/components/landing/emergency-guide-modal";
import { GuideKey } from "@/lib/emergency-guides";

const emergencyNumbers = [
  { number: "18", service: "Sapeurs-Pompiers", description: "Incendies, accidents, secours" },
  { number: "15", service: "SAMU", description: "Urgences médicales" },
  { number: "112", service: "Numéro européen", description: "Urgence depuis mobile" }
];

// Conseils détaillés fournis via modal interactive

export function PreventionSection() {
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<GuideKey>("18");

  const openGuide = (key: GuideKey) => {
    setInitial(key);
    setOpen(true);
  };

  return (
    <section id="prevention" className="py-12 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-[1920px] mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Shield} variant="gradient" size="md" className="icon-shield" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Numéros d&apos;urgence</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En cas d&apos;urgence, composez le bon numéro
          </p>
        </div>

        {/* Numéros d'urgence - compact cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto">
            {emergencyNumbers.map((emergency, index) => (
              <motion.button
                key={emergency.number}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                onClick={() => openGuide(emergency.number as GuideKey)}
                className="relative glass-card p-3 text-center rounded-lg h-[120px] flex flex-col justify-center items-center cursor-pointer hover:shadow-lg focus:outline-none"
              >
                <div className="absolute right-3 top-3 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">📖 Guide d&apos;appel</div>
                <div className="mb-2 flex justify-center">
                  <PremiumIcon
                    icon={Phone}
                    variant="glow"
                    size="sm"
                    className="icon-heart"
                  />
                </div>
                <div className="text-2xl font-bold text-primary mb-0">
                  {emergency.number}
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-1">
                  {emergency.service}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {emergency.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <EmergencyGuideModal open={open} onOpenChange={setOpen} initial={initial} />
        </div>
      </div>
    </section>
  );
}


