"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Calendar, Users, Shield, ExternalLink } from "lucide-react";

const newsItems = [
  {
    type: "amicale",
    title: "Assemblée générale 2024",
    date: "15 Mars 2024",
    description: "Rendez-vous annuel pour faire le bilan de nos actions et définir les orientations futures.",
    icon: Users,
    color: "icon-users"
  },
  {
    type: "local",
    title: "Journée prévention incendie",
    date: "22 Mars 2024",
    description: "Participation à la journée de sensibilisation organisée par la mairie de Clermont l'Hérault.",
    icon: Shield,
    color: "icon-shield"
  },
  {
    type: "amicale",
    title: "Collecte calendriers 2024",
    date: "En cours",
    description: "Vente de calendriers au profit de l'amicale. Contactez-nous pour en obtenir un.",
    icon: Calendar,
    color: "icon-target"
  },
  {
    type: "prevention",
    title: "Formation gestes qui sauvent",
    date: "5 Avril 2024",
    description: "Session de sensibilisation aux premiers secours ouverte à tous les citoyens.",
    icon: Shield,
    color: "icon-shield"
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
    <section id="actualites" className="py-20 bg-gradient-to-br from-slate-100 via-amber-50 to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
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
              icon={Calendar}
              variant="gradient"
              size="lg"
              className="icon-target"
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Actualités
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Suivez nos actions, événements locaux et initiatives de prévention
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {newsItems.map((item, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 group hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <PremiumIcon
                    icon={item.icon}
                    variant="glass"
                    size="md"
                    className={item.color}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <time className="text-sm text-muted-foreground">
                      {item.date}
                    </time>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                {item.description}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Lire la suite
                <ExternalLink className="h-4 w-4" />
              </motion.button>
            </motion.article>
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
              Restez informé
            </h3>
            <p className="text-muted-foreground mb-6">
              Suivez nos actualités et ne manquez aucun événement important
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                S&apos;abonner aux actualités
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
              >
                Voir toutes les actualités
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

