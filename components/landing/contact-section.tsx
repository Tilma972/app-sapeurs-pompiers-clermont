"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Mail, Phone, MapPin, ExternalLink, Users, Building } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@amicale-sp-clermont.fr",
    description: "Pour toute question sur l'amicale"
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "+33 4 67 XX XX XX",
    description: "Permanence les mercredis 18h-20h"
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "123 Rue des Pompiers",
    description: "34700 Clermont l'Hérault"
  }
];

const usefulLinks = [
  {
    category: "SDIS Hérault",
    icon: Building,
    color: "icon-shield",
    links: [
      { name: "Site officiel SDIS 34", url: "#", description: "Services départementaux" },
      { name: "Recrutement", url: "#", description: "Devenir sapeur-pompier" },
      { name: "Formations", url: "#", description: "Formations officielles" }
    ]
  },
  {
    category: "Partenaires",
    icon: Users,
    color: "icon-users",
    links: [
      { name: "Mairie de Clermont", url: "#", description: "Collectivité locale" },
      { name: "Préfecture de l'Hérault", url: "#", description: "Services de l'État" },
      { name: "Conseil Départemental", url: "#", description: "Collectivité départementale" }
    ]
  }
];

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
              icon={Mail}
              variant="gradient"
              size="lg"
              className="icon-users"
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Contact & Liens utiles
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Contactez l&apos;amicale ou accédez aux services officiels et partenaires
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* Contact Amicale */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Contact Amicale
            </h3>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 flex items-start gap-4"
                >
                  <div className="flex-shrink-0">
                    <PremiumIcon
                      icon={info.icon}
                      variant="glass"
                      size="md"
                      className="icon-shield"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {info.title}
                    </h4>
                    <p className="text-primary font-medium mb-1">
                      {info.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {info.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Formulaire de contact simple */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8"
            >
              <div className="glass-card p-8">
                <h4 className="text-lg font-semibold text-foreground mb-4">
                  Nous écrire
                </h4>
                <form className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Votre email"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Votre message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Envoyer le message
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>

          {/* Liens utiles */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">
              Liens utiles
            </h3>
            <div className="space-y-8">
              {usefulLinks.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <PremiumIcon
                      icon={category.icon}
                      variant="glass"
                      size="md"
                      className={category.color}
                    />
                    <h4 className="text-lg font-semibold text-foreground">
                      {category.category}
                    </h4>
                  </div>
                  
                  <div className="space-y-4">
                    {category.links.map((link, linkIndex) => (
                      <motion.a
                        key={link.name}
                        href={link.url}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: linkIndex * 0.05 }}
                        viewport={{ once: true }}
                        className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {link.name}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

