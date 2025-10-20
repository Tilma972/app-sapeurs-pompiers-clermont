"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Calendar, Users, Shield } from "lucide-react";

const newsItems = [
  {
    type: "amicale",
    title: "Assemblée générale 2025",
    date: "14 Novemvre 2025",
    description: "Rendez-vous annuel pour faire le bilan de nos actions et définir les orientations futures.",
    icon: Users,
    color: "icon-users"
  },
  {
    type: "local",
    title: "Journée Téléthon",
    date: "5-6 Décembre 2025",
    description: "Participation à la journée de sensibilisation organisée par la mairie de Clermont l'Hérault.",
    icon: Shield,
    color: "icon-shield"
  },
  {
    type: "amicale",
    title: "Tournée calendriers 2026",
    date: "En cours",
    description: "Vente de calendriers au profit de l'amicale. Contactez-nous pour en obtenir un.",
    icon: Calendar,
    color: "icon-target"
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "amicale":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "local":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
    case "prevention":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "amicale":
      return "Amicale";
    case "local":
      return "Local";
    case "prevention":
      return "Prévention";
    default:
      return "Actualité";
  }
};

export function NewsSection() {
  return (
    <section id="actualites" className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Calendar} variant="gradient" size="md" className="icon-target" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Actualités</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nos dernières nouvelles et événements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {newsItems.slice(0, 3).map((item, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="glass-card p-4 rounded-lg h-full"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0">
                  <PremiumIcon icon={item.icon} variant="glass" size="sm" className={item.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <time className="text-xs text-muted-foreground">{item.date}</time>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}


