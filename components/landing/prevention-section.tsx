"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Shield, Phone } from "lucide-react";

const emergencyNumbers = [
  { number: "18", service: "Sapeurs-Pompiers", description: "Incendies, accidents, secours" },
  { number: "15", service: "SAMU", description: "Urgences médicales" },
  { number: "112", service: "Numéro européen", description: "Urgence depuis mobile" }
];

// Conseils détaillés retirés sur la landing pour compacité

export function PreventionSection() {
  return (
    <section id="prevention" className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Shield} variant="gradient" size="md" className="icon-shield" />
          </div>
          <h2 className="text-2xl font-bold">Numéros d&apos;urgence</h2>
        </div>

        {/* Numéros d'urgence */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-3 gap-3 max-w-4xl mx-auto">
            {emergencyNumbers.map((emergency, index) => (
              <motion.div
                key={emergency.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-4 text-center"
              >
                <div className="mb-4 flex justify-center">
                  <PremiumIcon
                    icon={Phone}
                    variant="glow"
                    size="sm"
                    className="icon-heart"
                  />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {emergency.number}
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {emergency.service}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {emergency.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Avertissement */}
        <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          L&apos;amicale est une association de soutien. En cas d&apos;urgence, appelez le 18, 15 ou 112.
        </p>
      </div>
    </section>
  );
}



