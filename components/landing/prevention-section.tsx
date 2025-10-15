"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Shield, Phone, AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

const emergencyNumbers = [
  { number: "18", service: "Sapeurs-Pompiers", description: "Incendies, accidents, secours" },
  { number: "15", service: "SAMU", description: "Urgences médicales" },
  { number: "112", service: "Numéro européen", description: "Urgence depuis mobile" }
];

const preventionTips = [
  {
    title: "Gestes qui sauvent",
    description: "Les bases du secourisme que tout citoyen devrait connaître",
    icon: Shield,
    color: "icon-shield"
  },
  {
    title: "Accidents domestiques",
    description: "Prévention et conduite à tenir en cas d'accident à la maison",
    icon: AlertTriangle,
    color: "icon-zap"
  },
  {
    title: "Formations officielles",
    description: "Liens vers les formations SDIS pour approfondir vos connaissances",
    icon: BookOpen,
    color: "icon-target"
  }
];

export function PreventionSection() {
  return (
    <section id="prevention" className="py-20 bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
              icon={Shield}
              variant="gradient"
              size="lg"
              className="icon-shield"
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Prévention & Conseils
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Informations essentielles pour la sécurité de tous. En cas d&apos;urgence, contactez directement les services compétents.
          </p>
        </motion.div>

        {/* Numéros d'urgence */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-semibold text-foreground text-center mb-8">
            Numéros d&apos;urgence
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {emergencyNumbers.map((emergency, index) => (
              <motion.div
                key={emergency.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300"
              >
                <div className="mb-4 flex justify-center">
                  <PremiumIcon
                    icon={Phone}
                    variant="glow"
                    size="lg"
                    className="icon-heart"
                  />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {emergency.number}
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {emergency.service}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {emergency.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Conseils de prévention */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-semibold text-foreground text-center mb-8">
            Conseils de prévention
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {preventionTips.map((tip, index) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 text-center group hover:scale-105 transition-all duration-300"
              >
                <div className="mb-6 flex justify-center">
                  <PremiumIcon
                    icon={tip.icon}
                    variant="glass"
                    size="lg"
                    className={tip.color}
                  />
                </div>
                
                <h4 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {tip.title}
                </h4>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {tip.description}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
                >
                  En savoir plus
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Avertissement important */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="glass-card p-8 max-w-4xl mx-auto border-l-4 border-primary">
            <div className="flex items-start gap-4">
              <PremiumIcon
                icon={AlertTriangle}
                variant="minimal"
                size="md"
                className="icon-heart flex-shrink-0 mt-1"
              />
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Information importante
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  L&apos;amicale des sapeurs-pompiers est une association de soutien. 
                  Pour toute urgence, contactez directement les services de secours (18, 15, 112). 
                  Pour les formations officielles, renseignez-vous auprès du SDIS de l&apos;Hérault.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


