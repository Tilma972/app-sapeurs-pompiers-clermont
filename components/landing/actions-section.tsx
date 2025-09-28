"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Heart, Users, Calendar, Shield } from "lucide-react";

const actions = [
  {
    icon: Heart,
    title: "Soutien aux familles",
    description: "Accompagnement et solidarité envers les familles de sapeurs-pompiers",
    color: "icon-heart"
  },
  {
    icon: Users,
    title: "Événements associatifs",
    description: "Organisation d'événements pour renforcer les liens de la communauté",
    color: "icon-users"
  },
  {
    icon: Calendar,
    title: "Collectes solidaires",
    description: "Vente de calendriers et collectes au profit de l'amicale",
    color: "icon-target"
  },
  {
    icon: Shield,
    title: "Sensibilisation prévention",
    description: "Actions de prévention et sensibilisation aux gestes qui sauvent",
    color: "icon-shield"
  }
];

export function ActionsSection() {
  return (
    <section id="actions" className="py-20 bg-gradient-to-br from-slate-50 via-amber-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Actions de l&apos;amicale
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Notre engagement au service de la communauté et du soutien aux sapeurs-pompiers
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center group hover:scale-105 transition-all duration-300"
            >
              <div className="mb-6 flex justify-center">
                <PremiumIcon
                  icon={action.icon}
                  variant="glass"
                  size="lg"
                  className={action.color}
                />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Rejoignez notre mission
            </h3>
            <p className="text-muted-foreground mb-6">
              Ensemble, nous pouvons faire la différence dans notre communauté
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Nous soutenir
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
              >
                En savoir plus
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
