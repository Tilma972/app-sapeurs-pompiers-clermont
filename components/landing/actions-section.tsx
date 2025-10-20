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
    <section id="actions" className="py-12 bg-slate-800/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Actions de l&apos;amicale
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Notre engagement au service de la communauté</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 text-center group hover:shadow-md transition-shadow rounded-lg"
            >
              <div className="mb-2 flex justify-center">
                <PremiumIcon
                  icon={action.icon}
                  variant="glass"
                  size="md"
                  className={action.color}
                />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


